---
title: The hosts file
description: How Nearhost keeps one delimited block in /etc/hosts to resolve .test aliases.
sidebar:
  order: 5
---

`.test` is a reserved top-level domain that is never public, so Nearhost resolves aliases through `/etc/hosts` and not through DNS.

## The owned block

Nearhost owns one block and touches nothing else in the file:

```text
# nearhost:start
127.0.0.1 myapp.test
127.0.0.1 other.test
# nearhost:end
```

## How changes are applied

On any alias change, Nearhost computes the desired block in full and applies it with one sudo call. The command reads the aliases from stdin, one per line:

```sh
sudo nearhost hosts apply
```

The helper rewrites only the content between the markers. If the block is absent, it creates it at the end of the file.

## Removing it

Nothing is removed when Nearhost quits. To remove the block, which prompts for sudo:

```sh
nearhost hosts clean
```
