import { Context, Dict, Random, Schema } from 'koishi'
import {} from '@koishijs/plugin-rate-limit'
import { resolve } from 'path'

declare module 'koishi' {
  interface Events {
    'hangman/start'(this: Session, state: Stage, output: string[]): void
    'hangman/stop'(this: Session, state: Stage, output: string[]): void
    'hangman/win'(this: Session, state: Stage, output: string[]): void
    'hangman/lose'(this: Session, state: Stage, output: string[]): void
    'hangman/right'(this: Session, state: Stage, output: string[]): void
    'hangman/wrong'(this: Session, state: Stage, output: string[]): void
  }
}

export const name = 'hangman'

export interface Config {
  chances?: number
  wordList?: string
}

export const Config: Schema<Config> = Schema.object({
  chances: Schema.number().default(10).description('允许猜测的最大次数。'),
  wordList: Schema.string().description('存储单词表的文件路径。').hidden(process.env.KOISHI_ENV === 'browser'),
})

interface Word {
  text: string
}

interface Stage extends Word {
  history: string
  chances: number
  current: string
}

function Word(word: string | Word) {
  if (typeof word !== 'string') return word
  return { text: word }
}

export function apply(ctx: Context, config: Config) {
  function getWordList(): (string | Word)[] {
    if (process.env.KOISHI_ENV === 'browser' || !config.wordList) {
      return require('../words.json')
    } else {
      const filename = resolve(ctx.baseDir, config.wordList)
      return require(filename)
    }
  }

  const wordList = getWordList()
  const stages: Dict<Stage> = Object.create(null)

  ctx.i18n.define('zh', require('./locales/zh-CN'))

  ctx.command('hangman [letter:string]')
    .alias('hang', 'dsg')
    .shortcut('吊死鬼', { fuzzy: true })
    .option('quit', '-q', { notUsage: true })
    .action(async ({ session, options }, letters = '') => {
      const id = session.cid

      if (!stages[id]) {
        if (letters.length || options.quit) {
          return session.text('.idle')
        }

        const word = Word(Random.pick(wordList))
        const current = '?'.repeat(word.text.length)
        stages[id] = { ...word, current, history: '', chances: config.chances }
        const output = [session.text('.start', [current])]
        ctx.emit(session, 'hangman/start', stages[id], output)
        return output.join('\n')
      }

      const { current: _current, chances: _chances, history: _history, text } = stages[id]
      if (options.quit) {
        const output = [session.text('.stop')]
        ctx.emit(session, 'hangman/stop', stages[id], output)
        delete stages[id]
        return output.join('\n')
      }

      if (!letters.length) {
        if (_history) {
          return session.text('.history', stages[id])
        } else {
          return session.text('.history-clean', stages[id])
        }
      }

      for (const letter of letters.toLowerCase()) {
        if (letter < 'a' || letter > 'z' || stages[id].history.includes(letter)) continue

        const history = stages[id].history += letter
        if (text.includes(letter)) {
          const current = stages[id].current = text.split('').map(c => history.includes(c) ? c : '?').join('')
          if (current === text) {
            const answer = session.text('.answer', stages[id])
            const output = [session.text('.win', [answer, session.username])]
            delete stages[id]
            ctx.emit(session, 'hangman/win', stages[id], output)
            return output.join('\n')
          }
        } else {
          if (!(stages[id].chances -= 1)) {
            const answer = session.text('.answer', stages[id])
            const output = [session.text('.lose', [answer, session.username])]
            delete stages[id]
            ctx.emit(session, 'hangman/lose', stages[id], output)
            return output.join('\n')
          }
        }
      }

      const { chances, history } = stages[id]
      const charCount = history.length - _history.length
      if (!charCount) {
        if (letters.match(/[a-zA-Z]/)) {
          return session.text('.char-used')
        } else {
          return session.text('.char-invalid')
        }
      }

      if (_chances - chances === charCount) {
        const output = [session.text('.wrong', stages[id])]
        ctx.emit(session, 'hangman/wrong', stages[id], output)
        return output.join('\n')
      } else {
        const output = [session.text('.right', stages[id])]
        ctx.emit(session, 'hangman/right', stages[id], output)
        return output.join('\n')
      }
    })
}
