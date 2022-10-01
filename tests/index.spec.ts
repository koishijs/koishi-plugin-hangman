import { Context, Random } from 'koishi'
import mock from '@koishijs/plugin-mock'
import * as hangman from '../src'
import * as jest from 'jest-mock'

describe('koishi-plugin-hangman', () => {
  const pick = jest.spyOn(Random, 'pick')
  pick.mockReturnValue('hanging' as any)

  let app: Context
  beforeEach(async () => {
    app = new Context()
    app.plugin(mock)
    app.plugin(hangman)
    await app.start()
  })
  afterEach(async () => {
    await app.stop()
  })

  it('right guess', async () => {
    const client = app.mock.client('123')
    await client.shouldReply('hangman', '游戏开始，要猜的词为 ???????，剩余 10 次机会。')
    await client.shouldReply('hangman g', '尝试成功！剩余字母为 ???g??g，已使用的字母为 g，剩余 10 次机会。')
    await client.shouldReply('hangman an', '尝试成功！剩余字母为 ?ang?ng，已使用的字母为 gan，剩余 10 次机会。')
  })

  it('wrong guess', async () => {
    const client = app.mock.client('123')
    await client.shouldReply('hangman', '游戏开始，要猜的词为 ???????，剩余 10 次机会。')
    await client.shouldReply('hangman q', '尝试失败！剩余字母为 ???????，已使用的字母为 q，剩余 9 次机会。')
    await client.shouldReply('hangman we', '尝试失败！剩余字母为 ???????，已使用的字母为 qwe，剩余 7 次机会。')
  })

  it('mixed guess', async () => {
    const client = app.mock.client('123')
    await client.shouldReply('hangman', '游戏开始，要猜的词为 ???????，剩余 10 次机会。')
    await client.shouldReply('hangman eat', '尝试成功！剩余字母为 ?a?????，已使用的字母为 eat，剩余 8 次机会。')
    await client.shouldReply('hangman ea', '该字母已经使用过，换一个叭~')
  })

  it('invalid input', async () => {
    const client = app.mock.client('123')
    await client.shouldReply('hangman', '游戏开始，要猜的词为 ???????，剩余 10 次机会。')
    await client.shouldReply('hangman *', '请输入英文字母进行猜测。')
  })

  it('show history', async () => {
    const client = app.mock.client('123')
    await client.shouldReply('hangman', '游戏开始，要猜的词为 ???????，剩余 10 次机会。')
    await client.shouldReply('hangman', '当前要猜的词为 ???????，剩余 10 次机会。')
    await client.shouldReply('hangman asdf', '尝试成功！剩余字母为 ?a?????，已使用的字母为 asdf，剩余 7 次机会。')
    await client.shouldReply('hangman', '当前要猜的词为 ?a?????，已使用的字母为 asdf，剩余 7 次机会。')
  })

  it('game win', async () => {
    const client = app.mock.client('123')
    await client.shouldReply('hangman', '游戏开始，要猜的词为 ???????，剩余 10 次机会。')
    await client.shouldReply('hangman qwertyzxc', '尝试失败！剩余字母为 ???????，已使用的字母为 qwertyzxc，剩余 1 次机会。')
    await client.shouldReply('hangman hanging', '尝试成功！恭喜 123 回答正确！\n正确答案为：hanging。')
  })

  it('game lose', async () => {
    const client = app.mock.client('123')
    await client.shouldReply('hangman', '游戏开始，要猜的词为 ???????，剩余 10 次机会。')
    await client.shouldReply('hangman qwertyzxc', '尝试失败！剩余字母为 ???????，已使用的字母为 qwertyzxc，剩余 1 次机会。')
    await client.shouldReply('hangman b', '尝试失败！由于机会已耗尽，游戏结束。\n正确答案为：hanging。')
  })

  it('game quit', async () => {
    const client = app.mock.client('123')
    await client.shouldReply('hangman', '游戏开始，要猜的词为 ???????，剩余 10 次机会。')
    await client.shouldReply('hangman -q', '游戏结束。')
    await client.shouldReply('hangman -q', '没有正在进行的吊死鬼游戏。输入“吊死鬼”开始一轮游戏。')
  })
})
