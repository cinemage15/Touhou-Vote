<template>
  <div class="page"></div>
  <div class="w-full min-h-100vh flex flex-col">
    <div class="p-2 shadow flex items-center bg-white mb-2">
      <BackToHome :show="true" :saveable="false" />
      <div class="font-medium">第⑩届 国内东方人气投票 - CP部门</div>
    </div>

    <div class="md:flex-grow flex flex-wrap md:content-center p-1 space-y-2 md:w-1/2 3xl:w-1/4 md:m-auto">
      <div class="p-1 rounded w-full space-y-2 shadow bg-white bg-opacity-80">
        <div class="p-1 flex justify-between md:text-base xl:text-xl 2xl:text-2xl">
          <div>{{ '角色组合(' + couplesValid.length + '/' + couples.length + ')' }}</div>
        </div>
        <div class="shadow-inner p-2 rounded bg-gray-50 bg-opacity-50 space-y-2">
          <transition name="couple" mode="out-in">
            <div
              v-if="!couplesValid.length"
              key="no-selecting"
              class="w-full text-center text-gray-400 py-10 space-y-2"
            >
              <div>请点击下方的按钮</div>
              <div>选择一对您喜欢的CP吧!</div>
            </div>
            <div v-else key="selecting">
              <transition-group name="coupleList" tag="div">
                <div
                  v-for="(couple, index) in couplesValid"
                  :key="index"
                  class="transition transition-all duration-200 mb-2"
                >
                  <CoupleCard v-model:couple="couplesValid[index]" :index-of-couple="index" />
                </div>
              </transition-group>
            </div>
          </transition>
          <transition name="addMore" mode="out-in">
            <div
              v-if="couplesValid.length < couples.length"
              class="w-full shadow text-center bg-white cursor-pointer select-none p-2 rounded"
              @click="addCouple()"
            >
              <icon-uil-plus class="text-lg" />
              <div>添加组合</div>
            </div>
          </transition>
        </div>
        <div v-show="couplesValid.length" class="px-2 pb-2 flex justify-between">
          <div class="text-xl">本命组合：</div>
          <VoteSelect v-model:selected="coupleHonmeiNumber" :item-list="coupleHonmeiOptions" />
        </div>
      </div>

      <button
        :class="{ 'bg-accent-color-300': !couplesValid.length }"
        class="w-full py-2 rounded text text-white bg-accent-color-600 flex items-center space-x-1 justify-center"
        @click="checkVote()"
      >
        {{ couplesValid.length ? '提交!' : '请投票' }}
      </button>
    </div>
  </div>
  <VoteMessageBox v-model:open="confirmBoxOpen" title="请确定投票内容：">
    <div class="overflow-auto">
      <div class="divide-y p-2">
        <div v-if="coupleHonmei.honmei" class="py-1">
          <div class="text-lg">
            <label>本命CP：</label>
            <label v-for="(character, index) in computeCharactersValid(coupleHonmei.characters)" :key="character.id"
              >{{ character.name
              }}<label v-if="coupleHonmei.seme === index" class="text-accent-color-600">(主动)</label>，</label
            >
          </div>
        </div>
        <div v-for="(couple, indexCouple) in couplesValidWithoutHonmei" :key="indexCouple" class="py-1">
          <div class="">
            <label>{{ '投票位' + (indexCouple + 1) + '：' }}</label>
            <label v-for="(character, indexCharacter) in computeCharactersValid(couple.characters)" :key="character.id"
              >{{ character.name
              }}<label v-if="couple.seme === indexCharacter" class="text-accent-color-600">(主动)</label
              ><label v-if="indexCharacter != computeCharactersValid(couple.characters).length - 1">，</label></label
            >
          </div>
        </div>
        <div class="text-gray-500 italic">
          *票位序号仅用于核对投票内容，不影响权重<br />*投票期间可随时更改投票内容哦
        </div>
      </div>
      <button
        class="w-full py-2 rounded text text-white bg-accent-color-600 flex items-center space-x-1 justify-center"
        :class="{ 'bg-accent-color-300': loading }"
        @click="vote()"
      >
        <icon-uil-spinner-alt v-if="loading" class="animate-spin" /><label>{{
          loading ? '投票中' : '确认投票！'
        }}</label>
      </button>
    </div>
  </VoteMessageBox>
</template>

<script lang="ts" setup>
import { computed, ref, watch, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import NProgress from 'nprogress'
import { couples, updateVotecouple } from '@/vote-couple/lib/voteData'
import { coupleHonmei, couplesValid, couplesValidWithoutHonmei } from '@/vote-couple/lib/coupleList'
import CoupleCard from '@/vote-couple/components/CoupleCard.vue'
import VoteSelect from '@/common/components/VoteSelect.vue'
import VoteMessageBox from '@/common/components/VoteMessageBox.vue'
import BackToHome from '@/common/components/BackToHome.vue'
import type { Character } from '@/vote-character/lib/character'
import { character0 } from '@/vote-character/lib/character'
import { gql, useMutation, useQuery, useResult } from '@/graphql'
import type { Mutation, Query, schema } from '@/graphql'
import { voteCoupleComplete, voteToken } from '@/home/lib/user'
import { setSiteTitle } from '@/common/lib/setSiteTitle'
import { popMessageText } from '@/common/lib/popMessage'
import type { Couple } from './lib/couple'

setSiteTitle('CP部门 - 第⑩回 中文东方人气投票')

const {
  result,
  loading: getSubmitCPVoteLoading,
  onError: getSubmitCPVoteError,
} = useQuery<Query>(
  gql`
    query ($voteToken: String!) {
      getSubmitCPVote(voteToken: $voteToken) {
        cps {
          nameA
          nameB
          nameC
          active
          first
          reason
        }
      }
    }
  `,
  {
    voteToken: voteToken.value,
  },
  {
    fetchPolicy: 'network-only',
  }
)
watchEffect(() => {
  if (getSubmitCPVoteLoading.value) {
    if (!NProgress.isStarted()) NProgress.start()
  } else {
    if (NProgress.isStarted()) NProgress.done()
  }
})
const resultData = useResult(result, null, (data) => data?.getSubmitCPVote)
watchEffect(() => {
  if (resultData.value) {
    updateVotecouple(resultData.value.cps)
  }
})
getSubmitCPVoteError((err) => {
  console.log(err.message)
  if (err.graphQLErrors[0].extensions.error_kind === 'REQUEST_TOO_FREQUENT') popMessageText('请求过于频繁！')
  else popMessageText('获取投票信息失败！失败原因：' + err.message)
})

const coupleDisplayName = (item: Couple, index: number) => '投票位' + (index + 1)
const coupleHonmeiOptions = computed(() =>
  couplesValid.value.map((item, index) => ({
    name: coupleDisplayName(item, index),
    value: index,
  }))
)
const coupleHonmeiNumber = ref(updateCoupleHonmeiNumber())
function updateCoupleHonmeiNumber() {
  const honmeiIndex = couplesValid.value.findIndex((couple) => couple.honmei)
  return honmeiIndex === -1
    ? {
        name: '',
        value: -1,
      }
    : {
        name: coupleDisplayName(couplesValid.value[honmeiIndex], honmeiIndex),
        value: honmeiIndex,
      }
}
// Note: 'couples.value[coupleHonmeiNumber.value.value].honmei = true' has been moved to function vote() to avoid infinite call bug.
watch(
  couples,
  () => {
    coupleHonmeiNumber.value = updateCoupleHonmeiNumber()
  },
  { deep: true }
)

function addCouple(): void {
  couples.value[couplesValid.value.length].valid = true
}

const confirmBoxOpen = ref(false)

function computeCharactersValid(characterList: Character[]): Character[] {
  return characterList.filter((character) => character.id != character0.id)
}

function checkVote(): void {
  couples.value.map((item) => {
    item.honmei = false
  })
  if (coupleHonmeiNumber.value.value != -1) couples.value[coupleHonmeiNumber.value.value].honmei = true
  for (let i = 0; i < couplesValid.value.length; i++)
    if (computeCharactersValid(couplesValid.value[i].characters).length < 2) {
      popMessageText('投票位' + (i + 1) + '选择的角色数量小于两个！')
      return
    }
  for (let i = 0; i < couplesValid.value.length; i++)
    if (
      computeCharactersValid(couplesValid.value[i].characters).length === 3 &&
      (couplesValid.value[i].characters[2].name === couplesValid.value[i].characters[0].name ||
        couplesValid.value[i].characters[2].name === couplesValid.value[i].characters[1].name)
    ) {
      popMessageText('投票位' + (i + 1) + '不能填写两个相同的角色！（相同的角色只允许二人CP）')
      return
    }
  for (let i = 0; i < couplesValid.value.length; i++)
    for (let j = i + 1; j < couplesValid.value.length; j++) {
      let characterOverlapNumber = 0
      for (let m = 0; m < couplesValid.value[i].characters.length; m++)
        for (let n = 0; n < couplesValid.value[j].characters.length; n++) {
          if (couplesValid.value[i].characters[m].id === couplesValid.value[j].characters[n].id) {
            characterOverlapNumber++
            break
          }
        }
      if (
        characterOverlapNumber ===
        Math.min(couplesValid.value[i].characters.length, couplesValid.value[j].characters.length)
      ) {
        popMessageText('投票位' + (i + 1) + '投票位' + (j + 1) + '重复！')
        return
      }
    }
  confirmBoxOpen.value = true
}

const CPSubmit = computed<schema.CpSubmit[]>(() =>
  couplesValid.value.map((item) => {
    if (item.seme === -1)
      if (computeCharactersValid(item.characters).length === 3)
        return {
          nameA: computeCharactersValid(item.characters)[0].name,
          nameB: computeCharactersValid(item.characters)[1].name,
          nameC: computeCharactersValid(item.characters)[2].name,
          first: item.honmei,
          reason: item.reason,
        }
      else
        return {
          nameA: computeCharactersValid(item.characters)[0].name,
          nameB: computeCharactersValid(item.characters)[1].name,
          first: item.honmei,
          reason: item.reason,
        }
    else {
      if (computeCharactersValid(item.characters).length === 3)
        return {
          nameA: computeCharactersValid(item.characters)[0].name,
          nameB: computeCharactersValid(item.characters)[1].name,
          nameC: computeCharactersValid(item.characters)[2].name,
          active: item.characters[item.seme].name,
          first: item.honmei,
          reason: item.reason,
        }
      else
        return {
          nameA: computeCharactersValid(item.characters)[0].name,
          nameB: computeCharactersValid(item.characters)[1].name,
          active: item.characters[item.seme].name,
          first: item.honmei,
          reason: item.reason,
        }
    }
  })
)
const router = useRouter()
async function vote(): Promise<void> {
  mutate({ content: { voteToken: voteToken.value, cps: CPSubmit.value } })
}
const { mutate, loading, onDone, onError } = useMutation<Mutation>(
  gql`
    mutation ($content: CPSubmitGQL!) {
      submitCPVote(content: $content)
    }
  `
)
onDone((result) => {
  popMessageText('投票成功！')
  voteCoupleComplete.value = true
  router.push({ path: '/', query: { tab: 1, openList: 'vote', open: 1 } })
})
onError((error) => {
  console.log(error.graphQLErrors[0].extensions)
  if (error.graphQLErrors[0].extensions.error_kind === 'REQUEST_TOO_FREQUENT') popMessageText('请求过于频繁！')
  else popMessageText('投票失败，原因：' + error.graphQLErrors[0].extensions.human_readable_message)
})
</script>

<style lang="postcss" scoped>
.addMore-enter-active,
.addMore-leave-active,
.couple-enter-active,
.couple-leave-active {
  @apply transition-all duration-200;
}
.addMore-enter-from,
.addMore-leave-to,
.couple-enter-from,
.couple-leave-to {
  @apply opacity-0;
}
.coupleList-enter-active,
.coupleList-leave-active {
  @apply transition transition-all duration-200;
}

.coupleList-enter-from,
.coupleList-leave-to {
  @apply opacity-0  translate-y-2;
}
</style>
