#!/usr/bin/env python3
"""
도트 정리 — 제미나이가 그린 "도트 느낌" 그림을 진짜 도트 스프라이트 시트로 만든다.
설명: docs/art/IMAGE_WORK.md "도트 애니메이션"

  python3 scripts/dot_clean.py 원본.png 결과.png [--frames 4] [--keep-y] [--canvas 80x128] [--colors 28] [--preview 확대.png]

- 원본: 자홍색(#FF00FF) 단색 배경 위에 프레임들이 가로 한 줄로 놓인 그림 (오른쪽 아래 제미나이 ✦ 는 무시)
- 하는 일
  1) 배경을 지워 투명하게
  2) 그림 안 도트 한 칸 크기(보통 7~9px)를 찾아 한 칸 = 한 픽셀로 줄인다
  3) 모든 프레임의 색을 하나로 맞춘다 (밝은 흰색·노란색은 따로 지킨다)
  4) 외톨이 점을 지운다
  5) 프레임 정렬: 머리 가운데를 같은 가로 위치에, 발끝을 같은 바닥선에 (--keep-y 면 세로 위치는 원본 그대로 — 점프처럼 위아래로 움직이는 동작)
  6) 모든 프레임을 같은 크기의 칸(--canvas, 기본 80x128)에 넣어 가로로 이어 붙인다 (발끝 = 칸 아래에서 4px 위, 머리 가운데 = 칸 가운데)
- 결과: 투명 PNG 시트 (칸 크기 × 프레임 수). 게임은 칸 크기와 프레임 수로 잘라 쓴다
"""
import argparse
import numpy as np
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('out')
ap.add_argument('--frames', type=int, default=0, help='프레임 수 (0이면 자동)')
ap.add_argument('--keep-y', action='store_true', help='세로 위치를 원본대로 (점프 등)')
ap.add_argument('--canvas', default='80x128')
ap.add_argument('--colors', type=int, default=28)
ap.add_argument('--preview', default='')
a = ap.parse_args()
CW, CH = map(int, a.canvas.split('x'))

A = np.asarray(Image.open(a.src).convert('RGB')).astype(float)
Hh, Ww, _ = A.shape

def isbg(c):  # 자홍 배경과 그 번짐
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    return (r > 150) & (b > 150) & (g < 120) & (np.abs(r - b) < 90)

fg = ~isbg(A)
fg[int(Hh * 0.8):, int(Ww * 0.88):] = False      # 제미나이 ✦
fg[:, :4] = fg[:, -4:] = False
# 프레임 구간 — 세로로 비어 있는 열로 나눈다
cols = fg.sum(0) > 2
segs, s0 = [], None
for x, v in enumerate(cols):
    if v and s0 is None: s0 = x
    if not v and s0 is not None:
        if x - s0 > 20: segs.append((s0, x))
        s0 = None
if a.frames and len(segs) > a.frames:   # 너무 잘게 나뉘었으면 가까운 것끼리 합친다
    while len(segs) > a.frames:
        gaps = [segs[i + 1][0] - segs[i][1] for i in range(len(segs) - 1)]
        i = int(np.argmin(gaps)); segs[i:i + 2] = [(segs[i][0], segs[i + 1][1])]
rows = np.where(fg.sum(1) > 2)[0]
Y0, Y1 = max(0, rows.min() - 12), min(Hh, rows.max() + 12)
print(f'프레임 {len(segs)}개 · 세로 {Y0}~{Y1}')

# 도트 한 칸 크기 — 색 경계 위치의 주기
dx = np.abs(np.diff(A, axis=1)).sum(2); dy = np.abs(np.diff(A, axis=0)).sum(2)
ex = np.where(dx > 60)[1] + 0.5; ey = np.where(dy > 60)[0] + 0.5
def strength(e, s): return abs(np.exp(2j * np.pi * e / s).mean())
S = max(np.arange(5.0, 14.0, 0.01), key=lambda s: strength(ex, s) + strength(ey, s))
print(f'도트 한 칸 ≈ {S:.2f}px')
def phase(e): return (np.angle(np.exp(2j * np.pi * e / S).mean()) / (2 * np.pi) * S) % S

frames = []
for x0, x1 in segs:
    x0 = max(0, x0 - 12); x1 = min(Ww, x1 + 12)
    c = A[Y0:Y1, x0:x1]
    cdx = np.abs(np.diff(c, axis=1)).sum(2); cdy = np.abs(np.diff(c, axis=0)).sum(2)
    px = phase(np.where(cdx > 60)[1] + 0.5); py = phase(np.where(cdy > 60)[0] + 0.5)
    nx = int((c.shape[1] - px) // S); ny = int((c.shape[0] - py) // S)
    out = np.zeros((ny, nx, 4), np.uint8)
    for j in range(ny):
        for i in range(nx):
            cx = px + (i + 0.5) * S; cy = py + (j + 0.5) * S
            blk = c[int(cy) - 2:int(cy) + 3, int(cx) - 2:int(cx) + 3].reshape(-1, 3)
            med = np.median(blk, axis=0)
            if isbg(med[None])[0] or isbg(blk).mean() > 0.5: continue
            out[j, i, :3] = med; out[j, i, 3] = 255
    frames.append((out, py / S))   # 세로 위치(칸 단위) — keep-y 용

# 색 맞추기
allpx = np.concatenate([f[f[..., 3] > 0][:, :3] for f, _ in frames])
q = Image.fromarray(allpx.reshape(-1, 1, 3).astype(np.uint8)).quantize(colors=a.colors, method=Image.Quantize.MEDIANCUT)
pal = np.array(q.getpalette()[:a.colors * 3]).reshape(-1, 3)
light = allpx[allpx.min(1) > 175]
if len(light):
    lp = Image.fromarray(light.reshape(-1, 1, 3).astype(np.uint8)).quantize(colors=4, method=Image.Quantize.MEDIANCUT)
    pal = np.concatenate([pal, np.array(lp.getpalette()[:12]).reshape(-1, 3), [[250, 248, 252], [255, 240, 198]]])
def snap(f):
    o = f.copy(); m = o[..., 3] > 0
    px = o[m][:, :3].astype(int)
    o[m, :3] = pal[((px[:, None, :] - pal[None, :, :]) ** 2).sum(2).argmin(1)]
    return o
def despeckle(f):
    al = f[..., 3] > 0; p = np.pad(al, 1)
    n = p[:-2, 1:-1].astype(int) + p[2:, 1:-1] + p[1:-1, :-2] + p[1:-1, 2:]
    f = f.copy(); f[al & (n == 0)] = 0; return f
frames = [(despeckle(snap(f)), oy) for f, oy in frames]

# 정렬 → 같은 칸에
def info(f):
    ys, xs = np.where(f[..., 3] > 0)
    y0, y1 = ys.min(), ys.max()
    head = f[y0:y0 + max(1, int((y1 - y0) * 0.33)), :, 3] > 0
    return np.where(head)[1].mean(), y0, y1
base = max(info(f)[2] + oy for f, oy in frames)   # keep-y: 가장 낮은 발끝을 바닥으로
sheet = np.zeros((CH, CW * len(frames), 4), np.uint8)
for k, (f, oy) in enumerate(frames):
    hx, y0, y1 = info(f)
    ox = int(round(CW / 2 - hx))
    bottom = CH - 4
    oyy = int(round(bottom - (y1 if not a.keep_y else base - oy)))
    for j, i in zip(*np.where(f[..., 3] > 0)):
        X, Y = i + ox, j + oyy
        if 0 <= X < CW and 0 <= Y < CH: sheet[Y, CW * k + X] = f[j, i]
        else: print(f'  ! {k + 1}번 프레임이 칸({CW}x{CH})을 넘친다 — --canvas 를 키울 것'); break
Image.fromarray(sheet).save(a.out)
print(f'저장 {a.out} · 칸 {CW}x{CH} × {len(frames)}프레임 · 색 {len(pal)}')
if a.preview:
    big = Image.fromarray(sheet).resize((sheet.shape[1] * 4, CH * 4), Image.NEAREST)
    bg = Image.new('RGBA', big.size, (235, 230, 220, 255)); bg.alpha_composite(big); bg.convert('RGB').save(a.preview)
