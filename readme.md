# koishi-plugin-hangman

[![npm](https://img.shields.io/npm/v/koishi-plugin-hangman?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-hangman)

猜单词 (吊死鬼) 游戏。

## 基本玩法

系统将生成一个随机的英文词汇，玩家的目标是猜出这个词，共有 10 次尝试机会。
每次可以猜测一个字母，如果在词中出现则会提示出现位置，否则会消耗一次尝试机会。尝试机会用完则游戏失败。

- 输入 `hangman` 开始游戏
  - 如果此时已有进行的游戏，则会输入当前游戏状态
- 输入 `hangman [letters]` 进行猜测
  - 可以输入一串字母，表示同时猜测这些字母，此时次数也会一并被扣除
  - 输入的字母中如果包含已经猜测过的字母则不会扣除次数，因此你可以直接输入你想到的答案
- 输入 `hangman -q` 结束游戏

## 配置项

### chances

- 类型: `number`
- 默认值: `10`

允许猜测的最大次数。

### wordList

- 类型: `string`

存储单词表的文件路径。
