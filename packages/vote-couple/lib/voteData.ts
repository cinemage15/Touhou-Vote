import { ref, computed } from 'vue'
import { Couple } from '@/vote-couple/lib/couple'
import { characterList } from '@/vote-character/lib/characterList'
import { CpSubmitQuery } from '@/graphql/__generated__/graphql'
import { Character } from '@/vote-character/lib/character'

export const couples = ref<Couple[]>(
  Array(4)
    .fill(null)
    .map(() => new Couple())
)
export const coupleHonmei = computed<Couple>(() => couples.value.find((couple) => couple.honmei) || new Couple())

export function updateVotecouple(coupleVoteData: CpSubmitQuery[]): void {
  if (!coupleVoteData.length) return
  for (let i = 0; i < coupleVoteData.length; i++) {
    let coupleData = new Couple()
    coupleData.characters[0] = characterList.find((item) => item.name === coupleVoteData[i].nameA) || new Character()
    coupleData.characters[1] = characterList.find((item) => item.name === coupleVoteData[i].nameB) || new Character()
    if (coupleVoteData[i].nameC)
      coupleData.characters[2] = characterList.find((item) => item.name === coupleVoteData[i].nameC) || new Character()
    if (coupleVoteData[i].active)
      coupleData.seme = coupleData.characters.findIndex((item) => item.name === coupleVoteData[i].active)
    if (coupleVoteData[i].first) coupleData.honmei = true
    coupleData.valid = true
    couples.value[i] = coupleData
  }
}
