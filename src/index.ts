import { Context, Dict, Random, Schema } from 'koishi'
import {} from '@koishijs/plugin-rate-limit'

declare module 'koishi' {
  interface Events {
    'hangman/success'(output: string[]): void
  }
}

export const name = 'hangman'

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

interface State {
  word: string
  src: string
  type: string
  history: string
  chances: number
  current: string
  extreme?: number
}

export function apply(ctx: Context) {
  const states: Dict<State> = Object.create(null)

  ctx.command('hangman [letter:string]', '吊死鬼')
    .alias('hang', 'dsg')
    .shortcut('吊死鬼', { fuzzy: true })
    .option('quit', '-q  退出游戏', { notUsage: true })
    .usage([
      '系统将生成一个随机的英文词汇，玩家的目标是猜出这个词，共有 10 次尝试机会。',
      '每次可以猜测一个字母，如果在词中出现则会提示出现位置，否则会消耗一次尝试机会。尝试机会用完则游戏失败。',
    ].join('\n'))
    .action(async ({ session, options }, letters = '') => {
      const id = session.cid

      if (!states[id]) {
        if (letters.length || options.quit) {
          return '没有正在进行的吊死鬼游戏。输入“吊死鬼”开始一轮游戏。'
        }

        const [word, src, type] = Random.pick(wordList)
        const current = '?'.repeat(word.length)
        states[id] = { word, src, type, current, history: '', chances: 10, extreme: 1 }
        return `游戏开始，要猜的词为 ${current}，剩余 10 次机会。`
      }

      const { current: _current, chances: _chances, history: _history, word, src, type } = states[id]
      if (options.quit) {
        delete states[id]
        return '游戏已停止。'
      }

      if (!letters.length) {
        if (_history) {
          return `当前要猜的词为 ${_current}，已使用的字母为 ${_history}，剩余 ${_chances} 次机会。`
        } else {
          return `当前要猜的词为 ${_current}，剩余 ${_chances} 次机会。`
        }
      }

      for (const letter of letters.toLowerCase()) {
        if (letter < 'a' || letter > 'z' || states[id].history.includes(letter)) continue

        const history = states[id].history += letter
        if (word.includes(letter)) {
          const current = states[id].current = word.split('').map(c => history.includes(c) ? c : '?').join('')
          if (current === word) {
            const output = [
              `尝试成功！恭喜 ${session.username} 回答正确！`,
              `正确答案为：${word}，来源：${src}（${type}）。`,
            ]
            delete states[id]
            return output.join('\n')
          }
        } else {
          if (!(states[id].chances -= 1)) {
            delete states[id]
            return `尝试失败！由于机会已耗尽，游戏结束。\n正确答案为：${word}，来源：${src}（${type}）。`
          } else if (states[id].current === '?'.repeat(word.length)) {
            states[id].extreme += 1
          }
        }
      }

      const { current, chances, history } = states[id]
      const charCount = history.length - _history.length
      if (!charCount) {
        if (letters.match(/[a-zA-Z]/)) {
          return '该字母已经使用过，换一个叭~'
        } else {
          return '请输入英文字母进行猜测。'
        }
      }

      return `尝试${_chances - chances === charCount ? '失败' : '成功'}！剩余字母为 ${current}，已使用的字母为 ${history}，剩余 ${chances} 次机会。`
    })
}
