import { Context, Dict, Random, Schema } from 'koishi'
import {} from '@koishijs/plugin-rate-limit'

declare module 'koishi' {
  interface Events {
    'hangman/win'(output: string[]): void
    'hangman/lose'(output: string[]): void
  }
}

export const name = 'hangman'

export interface Config {
  wordList?: string
}

export const Config: Schema<Config> = Schema.object({
  wordList: Schema.string().description('存储单词表的文件路径。'),
})

interface State extends Word {
  history: string
  chances: number
  current: string
  extreme?: number
}

interface Word {
  text: string
}

function Word(word: string | Word) {
  if (typeof word !== 'string') return word
  return { text: word }
}

export function apply(ctx: Context, config: Config) {
  const states: Dict<State> = Object.create(null)

  const wordList: (string | Word)[] = require(config.wordList || '../words.json')

  ctx.i18n.define('zh', require('./locales/zh'))

  ctx.command('hangman [letter:string]')
    .alias('hang', 'dsg')
    .shortcut('吊死鬼', { fuzzy: true })
    .option('quit', '-q', { notUsage: true })
    .action(async ({ session, options }, letters = '') => {
      const id = session.cid

      if (!states[id]) {
        if (letters.length || options.quit) {
          return session.text('.idle')
        }

        const word = Word(Random.pick(wordList))
        const current = '?'.repeat(word.text.length)
        states[id] = { ...word, current, history: '', chances: 10, extreme: 1 }
        return session.text('.start', [current])
      }

      const { current: _current, chances: _chances, history: _history, text } = states[id]
      if (options.quit) {
        delete states[id]
        return session.text('.stop')
      }

      if (!letters.length) {
        if (_history) {
          return session.text('.history', states[id])
        } else {
          return session.text('.history-clean', states[id])
        }
      }

      for (const letter of letters.toLowerCase()) {
        if (letter < 'a' || letter > 'z' || states[id].history.includes(letter)) continue

        const history = states[id].history += letter
        if (text.includes(letter)) {
          const current = states[id].current = text.split('').map(c => history.includes(c) ? c : '?').join('')
          if (current === text) {
            const answer = session.text('.answer', states[id])
            const output = [session.text('.win', [answer, session.username])]
            delete states[id]
            ctx.emit('hangman/win', output)
            return output.join('\n')
          }
        } else {
          if (!(states[id].chances -= 1)) {
            const answer = session.text('.answer', states[id])
            const output = [session.text('.lose', [answer, session.username])]
            delete states[id]
            ctx.emit('hangman/lose', output)
            return output.join('\n')
          } else if (states[id].current === '?'.repeat(text.length)) {
            states[id].extreme += 1
          }
        }
      }

      const { chances, history } = states[id]
      const charCount = history.length - _history.length
      if (!charCount) {
        if (letters.match(/[a-zA-Z]/)) {
          return session.text('.char-used')
        } else {
          return session.text('.char-invalid')
        }
      }

      if (_chances - chances === charCount) {
        return session.text('.wrong', states[id])
      } else {
        return session.text('.right', states[id])
      }
    })
}
