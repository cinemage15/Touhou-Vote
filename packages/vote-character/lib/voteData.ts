import { computed, ref } from 'vue'
import { Character } from '@/vote-character/lib/character'
import { characterList } from '@/vote-character/lib/characterList'
import type { CharacterSubmitQuery } from '@/graphql/__generated__/graphql'

export const characterHonmei = computed<Character>(
  () => characters.value.find((character) => character.honmei) || new Character()
)
export const characters = ref<Character[]>(new Array(8).fill(null).map(() => new Character()))

export function updateVotecharacters(characterVoteData: CharacterSubmitQuery[]): void {
  if (!characterVoteData.length) return
  for (let i = 0; i < characterVoteData.length; i++) {
    const characterData = characterList.find((item) => item.name === characterVoteData[i].name) || characters.value[i]
    characterData.honmei = characterVoteData[i].first || false
    characterData.reason = characterVoteData[i].reason || ''
    characters.value[i] = characterData
  }
}
