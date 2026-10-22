import json, sys
e = json.load(open('src/edit.json', encoding='utf-8')); F = 30; segs = []; c = 0
for g in e['segments']:
    a = round(g['s'] * F); d = round(g['e'] * F) - a; segs.append((a, c, d)); c += d
def s2e(t):
    sf = round(t * F)
    for a, fr, d in segs:
        if sf < a: return fr
        if sf < a + d: return fr + sf - a
    return c
cu = {k: s2e(v) for k, v in e['cues'].items()}
spec = sys.argv[1].split(',')
out = []
for s in spec:
    if s.startswith('E'): out.append(c + int(s[1:]))
    elif s.startswith('S'): i, o = s[1:].split('+'); out.append(segs[int(i)][1] + int(o))
    else:
        k, _, o = s.partition('+'); out.append(cu[k] + int(o or 0))
print(','.join(map(str, out)))
