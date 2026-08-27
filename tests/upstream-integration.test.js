'use strict'

/**
 * 上游 v0.6.14~v0.6.16 整合回归测试（黑盒网关 + 源级前端断言）
 *
 * 黑盒部分（长轮询 wait、健康检查 probe 分支）复用 gateway.test 的启动模式：
 * 自起假 DSH 上游 + 本地网关，全部环境变量指向临时目录，不触网。
 *
 * 源级部分（sessionSortTime 排序、消息来源过滤、插话/折叠/多地址导入）
 * 沿 network-regression 的先例：读源码字符串断言关键语义，避免为 UI 层
 * 引入 DOM 沙箱这类重依赖。
 */

const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const { spawn } = require('node:child_process')
const crypto = require('node:crypto')
const fs = require('node:fs')
const http = require('node:http')
const os = require('node:os')
const path = require('node:path')
const net = require('node:net')
const { once } = require('node:events')

const ROOT = path.join(__dirname, '..')
const GATEWAY = path.join(ROOT, 'gateway.js')
const TOKEN = 'test-token'

let base = ''
let child = null
let tmpRoot = ''
let port = 0
let fakeUpstream = null
let fakePort = 0
const fakeSockets = new Set()

const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer()
    srv.once('error', reject)
    srv.listen(0, '127.0.0.1', () => {
      const { port: p } = srv.address()
      srv.close(() => resolve(p))
    })
  })
}

function wsAccept(key) {
  return crypto.createHash('sha1').update(String(key || '') + WS_GUID).digest('base64')
}

function encodeWsText(str) {
  const payload = Buffer.from(str)
  let header
  if (payload.length < 126) header = Buffer.from([0x81, payload.length])
  else {
    header = Buffer.alloc(4)
    header[0] = 0x81
    header[1] = 126
    header.writeUInt16BE(payload.length, 2)
  }
  return Buffer.concat([header, payload])
}

/**
 * 假上游：mux/host 各一条 WS，事件在连接建立 delayMs 后注入，
 * 便于测试「轮询挂起期间事件到达 → 及时返回」的路径。
 */
function startFakeUpstream(delayMs = 0) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      res.writeHead(404)
      res.end()
    })
    server.on('upgrade', (req, socket) => {
      fakeSockets.add(socket)
      socket.on('close', () => fakeSockets.delete(socket))
      socket.on('error', () => {})
      const accept = wsAccept(req.headers['sec-websocket-key'])
      socket.write(
        'HTTP/1.1 101 Switching Protocols\r\n' +
        'Upgrade: websocket\r\n' +
        'Connection: Upgrade\r\n' +
        `Sec-WebSocket-Accept: ${accept}\r\n\r\n`
      )
      const kind = req.url.includes('events.mux') ? 'mux' : req.url.includes('events.host') ? 'host' : null
      if (delayMs > 0) {
        setTimeout(() => {
          if (!socket.destroyed && kind) {
            socket.write(encodeWsText(JSON.stringify(
              kind === 'mux'
                ? { rpcId: 'm1', payload: { type: 'session/event', sessionId: 's1', event: { type: 'agent/status', seq: 1, data: { running: true } } } }
                : { rpcId: 'h1', payload: { type: 'host/session-status', sessionId: 's1', running: true } }
            )))
          }
        }, delayMs)
      }
    })
    server.listen(0, '127.0.0.1', () => {
      fakePort = server.address().port
      fakeUpstream = server
      resolve(server)
    })
    server.on('error', reject)
  })
}

async function stopFakeUpstream() {
  for (const s of fakeSockets) { try { s.destroy() } catch {} }
  fakeSockets.clear()
  if (fakeUpstream) {
    await new Promise((resolve) => fakeUpstream.close(() => resolve()))
    fakeUpstream = null
  }
}

function startChild() {
  child = spawn(process.execPath, [GATEWAY], {
    cwd: ROOT,
    env: {
      ...process.env,
      HOME: tmpRoot,
      USERPROFILE: tmpRoot,
      PORT: String(port),
      HOST: '127.0.0.1',
      DSH_UPSTREAM: `http://127.0.0.1:${fakePort}`,
      TOKEN,
      TOKEN_FILE: path.join(tmpRoot, 'token'),
      DSH_REMOTE_FS_ROOT: tmpRoot,
      DSH_REMOTE_NOTES: path.join(tmpRoot, 'notes.json'),
      UPDATE_CHECK_URL: 'http://127.0.0.1:1/update',
      UPDATE_INTERVAL_MS: '3600000',
      // 清空代理，保证网关对假上游与更新检查的连接都只走本机
      UPDATE_PROXY: '',
      HTTP_PROXY: '',
      HTTPS_PROXY: '',
      ALL_PROXY: '',
      NO_PROXY: '*'
    },
    stdio: ['ignore', 'pipe', 'pipe']
  })
  child.stdout.on('data', () => {})
  child.stderr.on('data', () => {})
}

async function waitForHealth(timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs
  let lastErr
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${base}/health`, { signal: AbortSignal.timeout(500) })
      if (res.ok) return
    } catch (err) { lastErr = err }
    await new Promise((r) => setTimeout(r, 50))
  }
  throw new Error('gateway did not become healthy: ' + (lastErr?.message || lastErr))
}

async function stopChild() {
  if (!child) return
  if (child.exitCode === null) {
    child.kill('SIGTERM')
    await Promise.race([
      once(child, 'exit').then(() => {}),
      new Promise((r) => setTimeout(r, 2000))
    ])
  }
  child = null
}

/* ---------------- 黑盒测试 ---------------- */

test('长轮询: wait=0 立即返回空缓冲(不挂起)', async () => {
  const res = await fetch(`${base}/api/events.poll?kind=mux&since=0&wait=0`, {
    headers: { authorization: 'Bearer ' + TOKEN },
    signal: AbortSignal.timeout(3000)
  })
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.ok, true)
  assert.equal(body.waitSupported, false)
  assert.ok(Array.isArray(body.events))
})

test('长轮询: wait>0 无事件时按 wait 挂起后超时返回空', async () => {
  // 用 host 通道（本测试上游注入延迟 700ms 的事件只发往 mux 之外的连接——
  // 见下面带注入的用例；这里不用延迟上游），先确保缓冲里没有 host 事件。
  const started = Date.now()
  const res = await fetch(`${base}/api/events.poll?kind=host&since=9999&wait=1200`, {
    headers: { authorization: 'Bearer ' + TOKEN },
    signal: AbortSignal.timeout(5000)
  })
  const elapsed = Date.now() - started
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.waitSupported, true)
  assert.ok(Array.isArray(body.events))
  // 挂起 ~1.2s 才超时返回，而不是立即空返回
  assert.ok(elapsed >= 1000, `expected hang ~1200ms, got ${elapsed}ms`)
  assert.ok(elapsed < 4000, `expected no longer than hang, got ${elapsed}ms`)
})

test('长轮询: wait 期间上游事件到达则立即返回(不等超时)', async () => {
  // 独立实例: 假上游在连接建立 700ms 后注入事件
  await stopChild()
  await stopFakeUpstream()
  await startFakeUpstream(700)
  port = await getFreePort()
  base = `http://127.0.0.1:${port}`
  startChild()
  await waitForHealth()
  // 立即发起长轮询(事件 700ms 后才到, wait 给足富余)
  const started = Date.now()
  const res = await fetch(`${base}/api/events.poll?kind=mux&since=0&wait=5000`, {
    headers: { authorization: 'Bearer ' + TOKEN },
    signal: AbortSignal.timeout(8000)
  })
  const elapsed = Date.now() - started
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.waitSupported, true)
  assert.equal(body.truncated, false)
  // 事件由 flush 唤醒: 返回应更接近 700ms 而不是 5000ms
  assert.ok(elapsed >= 500, `expected >= 500ms, got ${elapsed}ms`)
  assert.ok(elapsed < 3000, `expected flush before wait timeout, got ${elapsed}ms`)
  assert.ok(body.events.length >= 1, 'expected injected event')
  assert.equal(body.events[0].event.payload.type, 'session/event')
  assert.equal(body.events[0].event.payload.event.type, 'agent/status')
})

test('健康检查: probe=live 返回精简存活字段(不探测上游)', async () => {
  const res = await fetch(`${base}/health?probe=live`, {
    headers: { authorization: 'Bearer ' + TOKEN },
    signal: AbortSignal.timeout(5000)
  })
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.ok, true)
  assert.equal(body.probe, 'live')
  assert.equal(body.service, 'dsh-remote')
  assert.ok(body.liveness?.uptimeMs >= 0)
  assert.ok(!('events' in body), 'live probe 不应携带 events 明细')
  assert.ok(!('upstream' in body), 'live probe 不应触发上游探测字段')
})

test('健康检查: probe=readiness 返回完整链路与事件明细(eventLagMs)', async () => {
  const res = await fetch(`${base}/health?probe=readiness`, {
    headers: { authorization: 'Bearer ' + TOKEN },
    signal: AbortSignal.timeout(8000)
  })
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.ok, true)
  assert.ok(typeof body.status === 'string')
  assert.ok('readiness' in body)
  assert.ok('events' in body)
  for (const kind of ['mux', 'host']) {
    assert.ok(body.events[kind], `missing events.${kind}`)
    assert.ok('eventLagMs' in body.events[kind], `missing events.${kind}.eventLagMs`)
    assert.ok(typeof body.events[kind].eventLagMs === 'number' || body.events[kind].eventLagMs === null)
  }
  // 事件已注入过, lag 应为有限数字
  assert.equal(typeof body.events.mux.lastEventAt, 'number')
})

/* ---------------- 源级断言(前端整合语义不回归) ---------------- */

const APP_JS = fs.readFileSync(path.join(ROOT, 'public', 'app.js'), 'utf8')

test('前端: 会话排序以 sessionSortTime 为准(turn 时间优先于 updatedAt)', () => {
  assert.match(APP_JS, /function sessionSortTime\(s\)\s*\{\s*return Math\.max\(Number\(state\.sessionTurnTimes\[s\?\.sessionId\]\) \|\| 0, Number\(s\?\.updatedAt\) \|\| 0, Number\(s\?\.createdAt\) \|\| 0\)/)
  assert.match(APP_JS, /function noteSessionTurnTime\(sessionId, eventOrTime\)/)
  // sortedSessions 两个分支都必须用 sessionSortTime, 而不是裸 updatedAt
  const sorted = APP_JS.slice(APP_JS.indexOf('function sortedSessions'))
  assert.doesNotMatch(sorted, /\(b\.updatedAt \|\| 0\)\s*-\s*\(a\.updatedAt \|\| 0\)/)
  assert.match(sorted, /byWorkspace \|\| \(sessionSortTime\(b\) - sessionSortTime\(a\)\)/)
  assert.match(sorted, /return items\.sort\(\(a, b\) => sessionSortTime\(b\) - sessionSortTime\(a\)\)/)
  // 会话卡片显示时间同样走 sessionSortTime
  assert.match(APP_JS, /fmtTime\(sessionSortTime\(s\)\)/)
})

test('前端: 消息来源过滤(source.kind!=user 的 user/message 不显示)', () => {
  assert.match(APP_JS, /function messageSource\(data\)/)
  assert.match(APP_JS, /function isHumanUserMessage\(event\)/)
  assert.match(APP_JS, /return !source \|\| source\.kind === 'user'/)
  assert.match(APP_JS, /function shouldShowEvent\(type, event\)/)
  const shouldShow = APP_JS.slice(APP_JS.indexOf('function shouldShowEvent'))
  assert.match(shouldShow, /type === 'user\/message' && !isHumanUserMessage\(event\)/)
  // 历史与实时两条注入路径都传事件对象
  assert.match(APP_JS, /HistoryCore\.append\([^;]+shouldShowEvent\(ev\?\.type, ev\)/)
  assert.match(APP_JS, /HistoryCore\.append\(h\.seqs[^;]+shouldShowEvent\(ev\?\.type, ev\)/)
})

test('前端: 投影缓冲(applyProjection 对未出现会话暂存 + 水合)', () => {
  assert.match(APP_JS, /state\.pendingProjections/)
  assert.match(APP_JS, /function hydrateSessionProjections\(sessionId, projections\)/)
  assert.match(APP_JS, /function applyPendingProjections\(\)/)
  const apply = APP_JS.slice(APP_JS.indexOf('function applyProjection'))
  assert.match(apply, /if \(!s\) \{[\s\S]*?state\.pendingProjections\.set\(sessionId, pending\)/)
  assert.match(APP_JS, /function removeLocalSessionRecord\(sessionId\)[\s\S]*?state\.sessionActivity\.delete\(sessionId\)/)
})

test('前端: 恢复状态机(loading/cached/error/ready)接入加载链路', () => {
  assert.match(APP_JS, /function setSessionRecovery\(status, error = ''\)/)
  assert.match(APP_JS, /function recoveryLabel\(\)/)
  assert.match(APP_JS, /function resyncCurrentSession\(\)/)
  assert.match(APP_JS, /function resyncAfterStreamOpen\(\)[\s\S]*?state\.lastStreamResyncAt/)
  // loadHistory: 空会话判定依赖 loaded 标记
  assert.match(APP_JS, /state\.history\.loaded = true/)
  assert.match(APP_JS, /function isEmptySessionHistory\(history\)[\s\S]*?loaded === true/)
  // 轮询截断时重放当前会话
  assert.match(APP_JS, /if \(state\.current\) void resyncCurrentSession\(\)/)
})

test('前端: 插话(steer)队列钉与运行中文案', () => {
  assert.match(APP_JS, /function steerQueueItem\(itemId\)[\s\S]*?session\.updateQueue[\s\S]*?action: \{ kind: 'steer' \}/)
  assert.match(APP_JS, /function queuePreview\(item\)/)
  const renderQueue = APP_JS.slice(APP_JS.indexOf('function renderQueue'))
  assert.match(renderQueue, /queue-dock/)
  assert.match(renderQueue, /data-queue-steer/)
  assert.match(renderQueue, /state\.queues\[state\.current\]/)
  assert.match(APP_JS, /'btn-cancel'\)\.addEventListener\('click', cancelSession\)/)
})

test('前端: 子代理折叠卡(toggle 记忆展开状态)', () => {
  const cards = APP_JS.slice(APP_JS.indexOf('// 子代理'))
  assert.match(cards, /state\.subagentExpandedSession === sessionId/)
  assert.match(cards, /subagent-toggle/)
  assert.match(cards, /data-subagent-toggle/)
  assert.match(cards, /t\('subagent\.count', \{ n: sub\.entries\.length \}\)/)
})

test('前端: 重命名/页内归档/停止本轮文案接入', () => {
  assert.match(APP_JS, /function renameSession\(sessionId = state\.current\)/)
  assert.match(APP_JS, /function confirmRenameSession\(\)[\s\S]*?session\.rename[\s\S]*?applyProjection\(sessionId, 'title', value\.title, value\.seq\)/)
  assert.match(APP_JS, /function confirmArchiveSession\(\)[\s\S]*?workspace\.archiveSession/)
  assert.match(APP_JS, /async function closeSession\(\)[\s\S]*?shouldDiscardEmptySession[\s\S]*?removeLocalSessionRecord\(sessionId\)/)
  assert.match(APP_JS, /if \(state\.current === sessionId\) void closeSession\(\)/)
})

test('前端: 配对二维码多地址导入(server 可重复)', () => {
  const apply = APP_JS.slice(APP_JS.indexOf('function applyPairUrl'))
  assert.match(apply, /searchParams\.getAll\('server'\)/)
  assert.match(apply, /new Set\(/)
  assert.match(apply, /state\.server = servers\[0\]/)
})

test('前端: 实时摄像头扫码链路(实时优先 → 拍照回退)', () => {
  assert.match(APP_JS, /async function scanPairLive\(\)/)
  assert.match(APP_JS, /function scanLiveFrame\(\)[\s\S]*?liveScanBusy/)
  assert.match(APP_JS, /function closeLiveScan\(result = ''\)/)
  assert.match(APP_JS, /function startLiveScanWorker\(\)/)
  assert.match(APP_JS, /if \(source === 'CAMERA'\) \{[\s\S]*?const liveRaw = await scanPairLive\(\)/)
  assert.match(APP_JS, /if \(liveRaw !== undefined\)/)
})

before(async () => {
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-remote-upstream-test-'))
  await startFakeUpstream(0)
  port = await getFreePort()
  base = `http://127.0.0.1:${port}`
  startChild()
  await waitForHealth()
})

after(async () => {
  await stopChild()
  await stopFakeUpstream()
  fs.rmSync(tmpRoot, { recursive: true, force: true })
})