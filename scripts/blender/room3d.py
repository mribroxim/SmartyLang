"""
Smarty's 3D room — renders every room asset used by src/features/Room.

  blender --factory-startup -b -P scripts/blender/room3d.py -- [--only walls,floors,decor,icons,swatches,wear,trophies,bowl] [--fast] [--out public/room3d]

Everything is procedural (no external textures), original art. Layers share one
camera rig so the web page can stack them:
  wall-<id>-{p,l}.webp     back wall (opaque)                    p = portrait (phones), l = landscape
  floor-<id>-{p,l}.webp    floor + skirting, transparent above
  decor-<id>-{p,l}.webp    one decoration + its shadow, transparent
  wear/<id>.webp           accessory in the sticker's 100×100 box (see Accessories.tsx ANCHOR)
  trophy/<league>.webp     league trophies
  icon/<decor id>.webp     shop icons, swatch/<wall|floor id>.webp material swatches
  bowl.webp, fish.webp     feeding bowl and the meal
"""
import bpy, bmesh, math, os, sys
from mathutils import Vector, Matrix

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
def arg(name, default=None):
    for a in argv:
        if a.startswith(f'--{name}='): return a.split('=', 1)[1]
    return default
FAST = '--fast' in argv
ONLY = set((arg('only') or 'bowl').split(','))  # the drawn room (public/room) replaced the 3D room layers
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, arg('out', 'public/room3d'))
os.makedirs(OUT, exist_ok=True)

# ── colour + materials ─────────────────────────────────────────────────
def lin(hexstr):
    h = hexstr.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    f = lambda v: v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4
    return (f(c[0]), f(c[1]), f(c[2]), 1.0)

def new_mat(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes.get('Principled BSDF')
    return m, nt, p

def setp(p, **kw):
    names = {'color': 'Base Color', 'rough': 'Roughness', 'metal': 'Metallic', 'coat': 'Coat Weight', 'coat_rough': 'Coat Roughness',
             'sheen': 'Sheen Weight', 'trans': 'Transmission Weight', 'emit': 'Emission Color', 'emit_k': 'Emission Strength',
             'sss': 'Subsurface Weight', 'spec': 'Specular IOR Level', 'ior': 'IOR'}
    for k, v in kw.items():
        s = p.inputs[names[k]]
        s.default_value = lin(v) if isinstance(v, str) else v

def mat(name, color, **kw):
    m, nt, p = new_mat(name)
    setp(p, color=color, **kw)
    return m

def node(nt, kind, **inputs):
    n = nt.nodes.new(kind)
    for k, v in inputs.items():
        if k.startswith('_'):
            setattr(n, k[1:], v)
        else:
            n.inputs[k].default_value = v
    return n

def link(nt, a, b): nt.links.new(a, b)

def ramp(nt, fac, stops):
    r = nt.nodes.new('ShaderNodeValToRGB')
    el = r.color_ramp.elements
    el[0].position, el[0].color = stops[0][0], lin(stops[0][1])
    el[1].position, el[1].color = stops[-1][0], lin(stops[-1][1])
    for pos, col in stops[1:-1]:
        e = el.new(pos); e.color = lin(col)
    link(nt, fac, r.inputs['Factor'])
    return r.outputs['Color']

def mix(nt, fac, a, b):
    n = nt.nodes.new('ShaderNodeMix'); n.data_type = 'RGBA'
    for sock, val in ((n.inputs[0], fac), (n.inputs[6], a), (n.inputs[7], b)):
        if isinstance(val, (float, int)): sock.default_value = val
        elif isinstance(val, str): sock.default_value = lin(val)
        else: link(nt, val, sock)
    return n.outputs[2]

def math_(nt, op, a, b=0.0):
    n = nt.nodes.new('ShaderNodeMath'); n.operation = op
    for sock, val in ((n.inputs[0], a), (n.inputs[1], b)):
        if isinstance(val, (float, int)): sock.default_value = val
        else: link(nt, val, sock)
    return n.outputs[0]

def coords(nt, plane):
    """Object-space coords flattened to the surface (wall = x/z, floor = x/y)."""
    tc = nt.nodes.new('ShaderNodeTexCoord')
    if plane == 'xy': return tc.outputs['Object']
    sep = nt.nodes.new('ShaderNodeSeparateXYZ'); link(nt, tc.outputs['Object'], sep.inputs[0])
    comb = nt.nodes.new('ShaderNodeCombineXYZ')
    link(nt, sep.outputs['X'], comb.inputs['X']); link(nt, sep.outputs['Z'], comb.inputs['Y'])
    return comb.outputs[0]

def bump(nt, p, height, strength=0.2, distance=0.02):
    b = node(nt, 'ShaderNodeBump', Strength=strength, Distance=distance)
    link(nt, height, b.inputs['Height']); link(nt, b.outputs[0], p.inputs['Normal'])

def plaster(nt, p, v, k=0.12):
    n = node(nt, 'ShaderNodeTexNoise', Scale=38.0, Detail=6.0); link(nt, v, n.inputs['Vector'])
    bump(nt, p, n.outputs['Factor'], k, 0.01)
    return n.outputs['Factor']

# Wallpapers (on the x/z plane).
def wall_material(id_):
    m, nt, p = new_mat(id_)
    v = coords(nt, 'xy')  # the wall plane is rotated upright, so its local x/y run across the wall
    setp(p, rough=0.85)
    if id_ == 'wall.dots':
        vo = node(nt, 'ShaderNodeTexVoronoi', Scale=2.6, Randomness=0.0); link(nt, v, vo.inputs['Vector'])
        dot = math_(nt, 'LESS_THAN', vo.outputs['Distance'], 0.11)
        link(nt, mix(nt, dot, '#f7f4ee', '#c3cad6'), p.inputs['Base Color'])
        plaster(nt, p, v, 0.08)
    elif id_ == 'wall.plain':
        f = plaster(nt, p, v, 0.18)
        link(nt, ramp(nt, f, [(0.3, '#f3e6c8'), (0.7, '#fbf1da')]), p.inputs['Base Color'])
    elif id_ == 'wall.stripes':
        sep = nt.nodes.new('ShaderNodeSeparateXYZ'); link(nt, v, sep.inputs[0])
        fr = math_(nt, 'FRACT', math_(nt, 'MULTIPLY', sep.outputs['X'], 1.5))
        band = math_(nt, 'LESS_THAN', fr, 0.5)
        pin = math_(nt, 'LESS_THAN', math_(nt, 'ABSOLUTE', math_(nt, 'SUBTRACT', fr, 0.75)), 0.025)
        c = mix(nt, band, '#e6f3f7', '#c4e2ec')
        link(nt, mix(nt, pin, c, '#ffffff'), p.inputs['Base Color'])
        plaster(nt, p, v, 0.06)
    elif id_ == 'wall.stars':
        vo = node(nt, 'ShaderNodeTexVoronoi', Scale=2.2, Randomness=1.0); link(nt, v, vo.inputs['Vector'])
        gold = math_(nt, 'LESS_THAN', vo.outputs['Distance'], 0.075)
        vo2 = node(nt, 'ShaderNodeTexVoronoi', Scale=3.7, Randomness=1.0); link(nt, v, vo2.inputs['Vector'])
        pink = math_(nt, 'LESS_THAN', vo2.outputs['Distance'], 0.05)
        c = mix(nt, pink, '#f4e8f8', '#e7a6d8')
        link(nt, mix(nt, gold, c, '#e7b33c'), p.inputs['Base Color'])
        link(nt, gold, p.inputs['Metallic'])
        plaster(nt, p, v, 0.06)
    elif id_ == 'wall.bricks':
        b = node(nt, 'ShaderNodeTexBrick', Scale=1.0, **{'Mortar Size': 0.025, 'Brick Width': 0.62, 'Row Height': 0.24, 'Bias': 0.0, 'Mortar Smooth': 0.2})
        b.inputs['Color1'].default_value = lin('#c4673f'); b.inputs['Color2'].default_value = lin('#a8512f'); b.inputs['Mortar'].default_value = lin('#eadfcd')
        b.offset = 0.5
        link(nt, v, b.inputs['Vector'])
        n = node(nt, 'ShaderNodeTexNoise', Scale=14.0, Detail=8.0); link(nt, v, n.inputs['Vector'])
        link(nt, mix(nt, math_(nt, 'MULTIPLY', n.outputs['Factor'], 0.35), b.outputs['Color'], '#7a3a20'), p.inputs['Base Color'])
        h = math_(nt, 'SUBTRACT', 1.0, b.outputs['Factor'])
        bump(nt, p, math_(nt, 'ADD', h, math_(nt, 'MULTIPLY', n.outputs['Factor'], 0.15)), 0.45, 0.03)
    elif id_ == 'wall.night':
        vo = node(nt, 'ShaderNodeTexVoronoi', Scale=5.5, Randomness=1.0); link(nt, v, vo.inputs['Vector'])
        star = math_(nt, 'LESS_THAN', vo.outputs['Distance'], 0.035)
        vo2 = node(nt, 'ShaderNodeTexVoronoi', Scale=1.6, Randomness=1.0); link(nt, v, vo2.inputs['Vector'])
        big = math_(nt, 'LESS_THAN', vo2.outputs['Distance'], 0.045)
        s = math_(nt, 'MAXIMUM', star, big)
        link(nt, mix(nt, s, '#1b1f4d', '#fff4c9'), p.inputs['Base Color'])
        link(nt, mix(nt, big, '#ffffff', '#ffd76a'), p.inputs['Emission Color'])
        link(nt, math_(nt, 'MULTIPLY', s, 4.0), p.inputs['Emission Strength'])
        plaster(nt, p, v, 0.06)
    return m

# Floors (on the x/y plane).
def floor_material(id_):
    m, nt, p = new_mat(id_)
    v = coords(nt, 'xy')
    if id_ == 'floor.wood':
        b = node(nt, 'ShaderNodeTexBrick', Scale=1.0, **{'Mortar Size': 0.012, 'Brick Width': 2.2, 'Row Height': 0.42, 'Bias': 0.0, 'Mortar Smooth': 0.1})
        b.inputs['Color1'].default_value = lin('#c68a52'); b.inputs['Color2'].default_value = lin('#a5683a'); b.inputs['Mortar'].default_value = lin('#4a2a14')
        b.offset = 0.37
        link(nt, v, b.inputs['Vector'])
        mp = node(nt, 'ShaderNodeMapping'); mp.inputs['Scale'].default_value = (0.35, 9.0, 1.0); link(nt, v, mp.inputs['Vector'])
        g = node(nt, 'ShaderNodeTexNoise', Scale=3.0, Detail=10.0, Distortion=0.6); link(nt, mp.outputs[0], g.inputs['Vector'])
        grain = ramp(nt, g.outputs['Factor'], [(0.35, '#000000'), (0.65, '#ffffff')])
        link(nt, mix(nt, math_(nt, 'MULTIPLY', g.outputs['Factor'], 0.45), b.outputs['Color'], '#6b3a1a'), p.inputs['Base Color'])
        setp(p, rough=0.38, coat=0.35, coat_rough=0.15)
        bump(nt, p, math_(nt, 'SUBTRACT', 1.0, b.outputs['Factor']), 0.35, 0.02)
    elif id_ == 'floor.tiles':
        b = node(nt, 'ShaderNodeTexBrick', Scale=1.0, **{'Mortar Size': 0.03, 'Brick Width': 0.9, 'Row Height': 0.9, 'Bias': 0.0})
        b.offset = 0.0
        b.inputs['Color1'].default_value = lin('#eef1f5'); b.inputs['Color2'].default_value = lin('#dfe5ec'); b.inputs['Mortar'].default_value = lin('#9aa5b4')
        link(nt, v, b.inputs['Vector'])
        link(nt, b.outputs['Color'], p.inputs['Base Color'])
        setp(p, rough=0.18, coat=0.5, coat_rough=0.05)
        bump(nt, p, math_(nt, 'SUBTRACT', 1.0, b.outputs['Factor']), 0.5, 0.02)
    elif id_ == 'floor.carpet':
        n = node(nt, 'ShaderNodeTexNoise', Scale=160.0, Detail=4.0); link(nt, v, n.inputs['Vector'])
        n2 = node(nt, 'ShaderNodeTexNoise', Scale=6.0, Detail=3.0); link(nt, v, n2.inputs['Vector'])
        link(nt, ramp(nt, math_(nt, 'ADD', math_(nt, 'MULTIPLY', n.outputs['Factor'], 0.6), math_(nt, 'MULTIPLY', n2.outputs['Factor'], 0.4)),
                      [(0.3, '#e88aa0'), (0.7, '#f8b8c6')]), p.inputs['Base Color'])
        setp(p, rough=1.0, sheen=1.0)
        bump(nt, p, n.outputs['Factor'], 0.6, 0.01)
    elif id_ == 'floor.grass':
        mp = node(nt, 'ShaderNodeMapping'); mp.inputs['Scale'].default_value = (1.0, 1.0, 1.0); link(nt, v, mp.inputs['Vector'])
        n = node(nt, 'ShaderNodeTexNoise', Scale=90.0, Detail=6.0, Distortion=1.5); link(nt, mp.outputs[0], n.inputs['Vector'])
        n2 = node(nt, 'ShaderNodeTexNoise', Scale=4.0, Detail=4.0); link(nt, v, n2.inputs['Vector'])
        link(nt, ramp(nt, math_(nt, 'ADD', math_(nt, 'MULTIPLY', n.outputs['Factor'], 0.7), math_(nt, 'MULTIPLY', n2.outputs['Factor'], 0.3)),
                      [(0.3, '#3f8f2c'), (0.55, '#5fb83a'), (0.75, '#9be06a')]), p.inputs['Base Color'])
        setp(p, rough=0.9, sheen=0.6)
        bump(nt, p, n.outputs['Factor'], 1.0, 0.03)
    elif id_ == 'floor.checker':
        c = node(nt, 'ShaderNodeTexChecker', Scale=1.0)
        c.inputs['Color1'].default_value = lin('#f5f5f4'); c.inputs['Color2'].default_value = lin('#1c1c1e')
        mp = node(nt, 'ShaderNodeMapping'); mp.inputs['Scale'].default_value = (1.1, 1.1, 1.1); link(nt, v, mp.inputs['Vector'])
        link(nt, mp.outputs[0], c.inputs['Vector'])
        link(nt, c.outputs['Color'], p.inputs['Base Color'])
        setp(p, rough=0.12, coat=0.7, coat_rough=0.03)
    return m

WALLS = ['wall.dots', 'wall.plain', 'wall.stripes', 'wall.stars', 'wall.bricks', 'wall.night']
FLOORS = ['floor.wood', 'floor.tiles', 'floor.carpet', 'floor.grass', 'floor.checker']
DECOR = ['decor.rug', 'decor.window', 'decor.frame', 'decor.shelf', 'decor.plant', 'decor.lamp']

# ── geometry helpers ───────────────────────────────────────────────────
def clear_scene():
    for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
    for c in list(bpy.data.collections): bpy.data.collections.remove(c)
    for blk in (bpy.data.meshes, bpy.data.materials, bpy.data.lights, bpy.data.cameras, bpy.data.curves):
        for b in list(blk):
            if b.users == 0: blk.remove(b)

def to_obj(name, bm, material=None, smooth=True, parent=None):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    if smooth: me.polygons.foreach_set('use_smooth', [True] * len(me.polygons))
    o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o)
    if material: me.materials.append(material)
    if parent: o.parent = parent
    return o

def box(name, size, loc, material=None, bevel=0.0, segs=3, parent=None):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=Vector(size), verts=bm.verts)
    o = to_obj(name, bm, material, smooth=bevel > 0, parent=parent)
    o.location = loc
    if bevel > 0:
        md = o.modifiers.new('bevel', 'BEVEL'); md.width = bevel; md.segments = segs; md.limit_method = 'NONE'
        o.modifiers.new('wn', 'WEIGHTED_NORMAL')
    return o

def sphere(name, r, loc, material=None, scale=(1, 1, 1), seg=32, parent=None):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=seg // 2, radius=r)
    bmesh.ops.scale(bm, vec=Vector(scale), verts=bm.verts)
    o = to_obj(name, bm, material, parent=parent); o.location = loc
    return o

def cyl(name, r, depth, loc, material=None, seg=48, r2=None, bevel=0.0, parent=None):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r, radius2=r if r2 is None else r2, depth=depth)
    o = to_obj(name, bm, material, parent=parent); o.location = loc
    if bevel > 0:
        md = o.modifiers.new('bevel', 'BEVEL'); md.width = bevel; md.segments = 3; md.limit_method = 'ANGLE'
    return o

def torus(name, R, r, loc, material=None, rot=(0, 0, 0), maj=64, mnr=20, parent=None, arc=1.0):
    bm = bmesh.new()
    verts = []
    for i in range(maj + (0 if arc >= 1 else 1)):
        a = 2 * math.pi * arc * i / maj
        ring = []
        for j in range(mnr):
            b = 2 * math.pi * j / mnr
            x = (R + r * math.cos(b)) * math.cos(a); y = (R + r * math.cos(b)) * math.sin(a); z = r * math.sin(b)
            ring.append(bm.verts.new((x, y, z)))
        verts.append(ring)
    n = len(verts)
    for i in range(n if arc >= 1 else n - 1):
        a, b = verts[i], verts[(i + 1) % n]
        for j in range(mnr):
            bm.faces.new((a[j], b[j], b[(j + 1) % mnr], a[(j + 1) % mnr]))
    o = to_obj(name, bm, material, parent=parent); o.location = loc; o.rotation_euler = rot
    return o

def lathe(name, profile, loc, material=None, seg=64, parent=None):
    """Spin a (radius, z) profile around Z. Radius 0 points close the ends."""
    bm = bmesh.new()
    rings = []
    for r, z in profile:
        if r <= 1e-6:
            rings.append([bm.verts.new((0, 0, z))])
        else:
            rings.append([bm.verts.new((r * math.cos(2 * math.pi * i / seg), r * math.sin(2 * math.pi * i / seg), z)) for i in range(seg)])
    for a, b in zip(rings, rings[1:]):
        if len(a) == 1 and len(b) == 1: continue
        if len(a) == 1:
            for i in range(seg): bm.faces.new((a[0], b[i], b[(i + 1) % seg]))
        elif len(b) == 1:
            for i in range(seg): bm.faces.new((a[i], b[0], a[(i + 1) % seg]))
        else:
            for i in range(seg): bm.faces.new((a[i], b[i], b[(i + 1) % seg], a[(i + 1) % seg]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = to_obj(name, bm, material, parent=parent); o.location = loc
    return o

def extrude_shape(name, pts2d, depth, loc, material=None, rot=(math.radians(90), 0, 0), bevel=0.0, parent=None):
    """Extrude a 2D outline (x, y) by depth; default rotation stands it up facing -Y."""
    bm = bmesh.new()
    bottom = [bm.verts.new((x, y, -depth / 2)) for x, y in pts2d]
    top = [bm.verts.new((x, y, depth / 2)) for x, y in pts2d]
    bm.faces.new(bottom[::-1]); bm.faces.new(top)
    n = len(pts2d)
    for i in range(n): bm.faces.new((bottom[i], bottom[(i + 1) % n], top[(i + 1) % n], top[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = to_obj(name, bm, material, smooth=False, parent=parent); o.location = loc; o.rotation_euler = rot
    if bevel > 0:
        md = o.modifiers.new('bevel', 'BEVEL'); md.width = bevel; md.segments = 3; md.limit_method = 'ANGLE'
        o.modifiers.new('wn', 'WEIGHTED_NORMAL')
    return o

def star_pts(R, r, n=5, rot=math.pi / 2):
    return [((R if i % 2 == 0 else r) * math.cos(rot + i * math.pi / n), (R if i % 2 == 0 else r) * math.sin(rot + i * math.pi / n)) for i in range(2 * n)]

def empty(name, loc=(0, 0, 0)):
    o = bpy.data.objects.new(name, None); bpy.context.scene.collection.objects.link(o); o.location = loc
    return o

def subsurf(o, lv=2):
    m = o.modifiers.new('sub', 'SUBSURF'); m.levels = lv; m.render_levels = lv
    return o

# ── render setup ───────────────────────────────────────────────────────
def setup_render(w, h, samples=None, transparent=True):
    s = bpy.context.scene
    s.render.engine = 'CYCLES'
    prefs = bpy.context.preferences.addons['cycles'].preferences
    for t in ('OPTIX', 'CUDA'):
        try:
            prefs.compute_device_type = t; prefs.get_devices()
            for d in prefs.devices: d.use = d.type != 'CPU'
            s.cycles.device = 'GPU'
            break
        except Exception:
            continue
    s.cycles.samples = samples or (24 if FAST else 128)
    s.cycles.use_denoising = True
    s.cycles.max_bounces = 6
    s.render.resolution_x, s.render.resolution_y, s.render.resolution_percentage = w, h, 100
    s.render.film_transparent = transparent
    s.render.image_settings.file_format = 'WEBP'
    s.render.image_settings.color_mode = 'RGBA' if transparent else 'RGB'
    s.render.image_settings.quality = 82
    try:
        s.view_settings.view_transform = 'AgX'
        s.view_settings.look = 'AgX - Medium High Contrast'
    except Exception:
        pass

def render(path):
    full = os.path.join(OUT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    bpy.context.scene.render.filepath = full
    bpy.ops.render.render(write_still=True)
    print('RENDERED', path, flush=True)

def world(color='#dfe6f0', strength=0.55):
    w = bpy.data.worlds.get('W') or bpy.data.worlds.new('W')
    w.use_nodes = True
    bg = w.node_tree.nodes.get('Background')
    bg.inputs[0].default_value = lin(color); bg.inputs[1].default_value = strength
    bpy.context.scene.world = w

def light(kind, name, loc, rot, energy, color='#ffffff', size=1.0, angle=None):
    d = bpy.data.lights.new(name, kind); d.energy = energy; d.color = lin(color)[:3]
    if kind == 'AREA': d.size = size
    if kind == 'SUN' and angle is not None: d.angle = math.radians(angle)
    if kind in ('POINT', 'SPOT'): d.shadow_soft_size = size
    o = bpy.data.objects.new(name, d); bpy.context.scene.collection.objects.link(o)
    o.location = loc; o.rotation_euler = [math.radians(a) for a in rot]
    return o

def look_at(o, target):
    d = Vector(target) - o.location
    o.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()

def set_visible(objs, on):
    for o in objs:
        o.hide_render = not on
        for c in o.children_recursive: c.hide_render = not on

# ── the room ───────────────────────────────────────────────────────────
INK = None
def room_scene():
    clear_scene()
    global INK
    INK = mat('ink', '#18181b', rough=0.35, coat=0.4)
    world('#e7edf5', 0.45)
    light('SUN', 'sun', (0, 0, 10), (52, 0, 28), 3.2, '#fff1dc', angle=6)
    fill = light('AREA', 'fill', (-2.5, -9, 6.5), (0, 0, 0), 900, '#e8f0ff', size=9); look_at(fill, (0, 0, 2))
    rim = light('AREA', 'top', (0, -3, 9.5), (0, 0, 0), 250, '#ffffff', size=6); look_at(rim, (0, -2, 0))

    # wall + floor (one plane each; material swapped per render)
    bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=14)
    wall = to_obj('wall', bm, smooth=False); wall.rotation_euler = (math.radians(90), 0, 0); wall.location = (0, 0, 7)
    wall.data.materials.append(wall_material('wall.dots'))
    bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=14)
    floor = to_obj('floor', bm, smooth=False); floor.location = (0, -10, 0)
    floor.data.materials.append(floor_material('floor.wood'))
    skirt = box('skirting', (28, 0.12, 0.34), (0, -0.06, 0.17), mat('skirt', '#fbfaf7', rough=0.35, coat=0.3), bevel=0.02)

    decor = {d: build_decor(d) for d in DECOR}

    cams = {}
    for key, (w, h) in {'p': (900, 1600), 'l': (1800, 1200)}.items():
        cd = bpy.data.cameras.new('cam' + key); cd.sensor_fit = 'VERTICAL'; cd.sensor_height = 24; cd.lens = 31
        cam = bpy.data.objects.new('cam' + key, cd); bpy.context.scene.collection.objects.link(cam)
        cam.location = (0, -13.0, 3.3)
        cams[key] = (cam, w, h)
    # Aim so the wall/floor seam sits 66% down the frame (where the page expects the floor to start).
    from bpy_extras.object_utils import world_to_camera_view
    s = bpy.context.scene
    for cam, w, h in cams.values():
        s.render.resolution_x, s.render.resolution_y = w, h
        lo, hi = -30.0, 10.0
        for _ in range(40):
            mid = (lo + hi) / 2
            cam.rotation_euler = (math.radians(90 + mid), 0, 0)
            bpy.context.view_layer.update()
            v = world_to_camera_view(s, cam, Vector((0, 0, 0))).y
            if v > 0.34: lo = mid
            else: hi = mid
    return wall, floor, skirt, decor, cams

def build_decor(id_):
    root = empty(id_)
    wood = mat(id_ + '.wood', '#b07444', rough=0.45, coat=0.3)
    if id_ == 'decor.window':
        root.location = (0.55, -0.02, 4.35)
        frame_m = mat('win.frame', '#fbfaf7', rough=0.3, coat=0.4)
        W, H, T = 2.2, 2.3, 0.16
        for nm, size, loc in (('top', (W + T, 0.22, T), (0, -0.08, H / 2)), ('bot', (W + T, 0.22, T), (0, -0.08, -H / 2)),
                              ('l', (T, 0.22, H), (-W / 2, -0.08, 0)), ('r', (T, 0.22, H), (W / 2, -0.08, 0)),
                              ('mv', (0.08, 0.12, H), (0, -0.07, 0)), ('mh', (W, 0.12, 0.08), (0, -0.07, 0))):
            box('win.' + nm, size, loc, frame_m, bevel=0.03, parent=root)
        box('win.sill', (W + 0.6, 0.42, 0.12), (0, -0.2, -H / 2 - 0.1), frame_m, bevel=0.03, parent=root)
        # sky (emissive gradient) with puffy clouds behind the glass
        sky, nt, p = new_mat('win.sky')
        tc = nt.nodes.new('ShaderNodeTexCoord'); sep = nt.nodes.new('ShaderNodeSeparateXYZ'); link(nt, tc.outputs['Generated'], sep.inputs[0])
        link(nt, ramp(nt, sep.outputs['Y'], [(0.0, '#bfe6ff'), (1.0, '#5eb3f0')]), p.inputs['Emission Color'])
        setp(p, color='#000000', emit_k=1.2)
        bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=1.0)
        bmesh.ops.scale(bm, vec=Vector((W / 2, H / 2, 1)), verts=bm.verts)
        so = to_obj('win.skyplane', bm, sky, smooth=False, parent=root); so.rotation_euler = (math.radians(90), 0, 0); so.location = (0, 0.02, 0)
        cloud = mat('win.cloud', '#ffffff', rough=0.9, emit='#ffffff', emit_k=0.6)
        for cx, cz, s_ in ((-0.55, 0.55, 0.18), (-0.35, 0.6, 0.24), (-0.15, 0.55, 0.17), (0.45, -0.3, 0.16), (0.62, -0.25, 0.22), (0.8, -0.3, 0.15)):
            sphere('win.cloud', s_, (cx, -0.01, cz), cloud, scale=(1.4, 0.3, 1), parent=root)
        glass = mat('win.glass', '#ffffff', rough=0.02, trans=1.0, ior=1.45)
        box('win.glass', (W, 0.02, H), (0, -0.05, 0), glass, parent=root)
        # curtains
        cur = mat('win.curtain', '#f2c14e', rough=0.8, sheen=0.8)
        for sx in (-1, 1):
            c = box('win.curtain', (0.45, 0.12, H + 0.5), (sx * (W / 2 + 0.25), -0.28, 0.05), cur, bevel=0.05, parent=root)
            sw = c.modifiers.new('wave', 'WAVE'); sw.use_normal = False; sw.use_x = True; sw.use_y = False; sw.height = 0.05; sw.width = 0.25; sw.narrowness = 1.5
            sub = c.modifiers.new('sub', 'SUBSURF'); sub.levels = 2; sub.render_levels = 2
        box('win.rod', (W + 1.4, 0.06, 0.06), (0, -0.32, H / 2 + 0.32), mat('rod', '#3a3a3c', metal=1.0, rough=0.3), bevel=0.02, parent=root)
    elif id_ == 'decor.frame':
        root.location = (-1.85, -0.02, 4.55)
        box('frame.border', (1.25, 0.1, 0.98), (0, -0.05, 0), mat('frame.wood', '#2a2a2d', rough=0.35, coat=0.5), bevel=0.04, parent=root)
        box('frame.mat', (1.05, 0.1, 0.78), (0, -0.07, 0), mat('frame.paper', '#fffdf6', rough=0.9), parent=root)
        fish = mat('frame.fish', '#18181b', rough=0.6)
        body = sphere('frame.fishbody', 0.22, (0.05, -0.13, 0), fish, scale=(1.4, 0.15, 0.85), parent=root)
        extrude_shape('frame.tail', [(0, 0), (-0.22, 0.17), (-0.22, -0.17)], 0.03, (-0.22, -0.13, 0), fish, parent=root)
        sphere('frame.eye', 0.035, (0.2, -0.17, 0.04), mat('white', '#ffffff', rough=0.3), scale=(1, 0.3, 1), parent=root)
    elif id_ == 'decor.shelf':
        root.location = (-1.85, -0.02, 2.75)
        box('shelf.board', (1.6, 0.42, 0.1), (0, -0.21, 0), wood, bevel=0.025, parent=root)
        for sx in (-0.55, 0.55):
            extrude_shape('shelf.bracket', [(0, 0), (0, -0.3), (0.28, 0)], 0.06, (sx, -0.04, -0.05), INK, rot=(0, 0, math.radians(-90)), parent=root)
        gold = mat('shelf.gold', '#e7b33c', metal=1.0, rough=0.22)
        silver = mat('shelf.silver', '#c9ced6', metal=1.0, rough=0.25)
        for x, m_, s_ in ((-0.45, gold, 0.85), (0.02, gold, 1.0), (0.48, silver, 0.75)):
            cup = trophy_cup('shelf.cup', m_, parent=root); cup.location = (x, -0.22, 0.05); cup.scale = (0.28 * s_,) * 3
    elif id_ == 'decor.rug':
        root.location = (0, -3.6, 0.0)
        rug = lathe('rug.body', [(0, 0.035), (1.7, 0.035), (1.75, 0.0)], (0, 0, 0), None, seg=96, parent=root)
        rug.scale = (1.35, 0.75, 1)
        m, nt, p = new_mat('rug.mat')
        tc = nt.nodes.new('ShaderNodeTexCoord')
        g = node(nt, 'ShaderNodeTexGradient', _gradient_type='SPHERICAL'); link(nt, tc.outputs['Object'], g.inputs['Vector'])
        mp = node(nt, 'ShaderNodeMapping'); mp.inputs['Scale'].default_value = (0.58, 0.58, 1); link(nt, tc.outputs['Object'], mp.inputs['Vector']); link(nt, mp.outputs[0], g.inputs['Vector'])
        bands = math_(nt, 'FRACT', math_(nt, 'MULTIPLY', g.outputs['Factor'], 4.0))
        link(nt, ramp(nt, bands, [(0.0, '#d9455c'), (0.5, '#d9455c'), (0.52, '#f6cdd4'), (0.75, '#f6cdd4'), (0.77, '#e58395'), (1.0, '#e58395')]), p.inputs['Base Color'])
        n = node(nt, 'ShaderNodeTexNoise', Scale=120.0); link(nt, tc.outputs['Object'], n.inputs['Vector'])
        setp(p, rough=1.0, sheen=0.35); bump(nt, p, n.outputs['Factor'], 0.5, 0.01)
        rug.data.materials.append(m)
    elif id_ == 'decor.plant':
        root.location = (-2.15, -0.75, 0.0)
        pot = mat('plant.pot', '#d9733f', rough=0.7)
        lathe('plant.pot', [(0, 0.0), (0.32, 0.0), (0.4, 0.62), (0.47, 0.64), (0.47, 0.76), (0.42, 0.76), (0.38, 0.68), (0, 0.68)], (0, 0, 0), pot, parent=root)
        soil = cyl('plant.soil', 0.38, 0.04, (0, 0, 0.7), mat('soil', '#3b2516', rough=1.0), parent=root)
        leaf_m = mat('plant.leaf', '#2f9e55', rough=0.45, coat=0.3, sss=0.15)
        stem_m = mat('stem', '#2a7a40', rough=0.6)
        import random
        rnd = random.Random(7)
        base = Vector((0, 0, 0.7))
        for i in range(11):
            a = i * 2.39996 + rnd.random() * 0.3
            t = math.radians(12 + (i / 10) * 38 + rnd.random() * 8)
            h = 0.75 + rnd.random() * 0.55 + (1 - i / 10) * 0.35
            d = Vector((math.sin(t) * math.cos(a), math.sin(t) * math.sin(a), math.cos(t)))
            q = d.to_track_quat('Z', 'Y')
            st = cyl('plant.stem', 0.02, h, base + d * (h / 2), stem_m, seg=8, parent=root); st.rotation_mode = 'QUATERNION'; st.rotation_quaternion = q
            # leaf: a flattened, slightly cupped teardrop that droops outward from the stem tip
            out = Vector((math.cos(a), math.sin(a), 0))
            ld = (d + out * 0.9 + Vector((0, 0, -0.15))).normalized()
            lf = sphere('plant.leaf', 0.27, base + d * h + ld * 0.26, leaf_m, scale=(0.62, 0.1, 1.0), parent=root)
            lf.rotation_mode = 'QUATERNION'; lf.rotation_quaternion = ld.to_track_quat('Z', 'X')
            sd = lf.modifiers.new('cup', 'SIMPLE_DEFORM'); sd.deform_method = 'BEND'; sd.angle = math.radians(35); sd.deform_axis = 'Z'
    elif id_ == 'decor.lamp':
        root.location = (1.85, -0.8, 0.0)
        metal = mat('lamp.metal', '#2c2c2e', metal=1.0, rough=0.3)
        lathe('lamp.base', [(0, 0), (0.42, 0), (0.42, 0.06), (0.3, 0.12), (0, 0.12)], (0, 0, 0), metal, parent=root)
        cyl('lamp.pole', 0.035, 2.2, (0, 0, 1.2), metal, seg=16, parent=root)
        shade_m, nt, p = new_mat('lamp.shade'); setp(p, color='#fde8a8', rough=0.8, emit='#ffd27a', emit_k=1.2, sss=0.2)
        lathe('lamp.shade', [(0.55, 2.15), (0.27, 2.75), (0.25, 2.75), (0.53, 2.15)], (0, 0, 0), shade_m, parent=root)
        bulb = sphere('lamp.bulb', 0.11, (0, 0, 2.25), mat('bulb', '#fff6d8', emit='#fff2c4', emit_k=8.0), parent=root)
    return root

def trophy_cup(name, m_, parent=None):
    """Classic cup: base, stem, bowl, two handles. Unit height ≈ 1.6."""
    root = empty(name)
    if parent: root.parent = parent
    lathe(name + '.body', [(0, 0), (0.55, 0), (0.55, 0.16), (0.42, 0.2), (0.4, 0.32), (0.12, 0.38), (0.09, 0.6), (0.14, 0.68),
                           (0.52, 0.86), (0.66, 1.2), (0.7, 1.52), (0.64, 1.55), (0.6, 1.25), (0.48, 0.96), (0.1, 0.78), (0, 0.78)],
          (0, 0, 0), m_, parent=root)
    for sx in (-1, 1):
        torus(name + '.handle', 0.22, 0.055, (sx * 0.72, 0, 1.2), m_, rot=(math.radians(90), 0, 0), parent=root)
    return root

def render_room():
    wall, floor, skirt, decor, cams = room_scene()
    s = bpy.context.scene
    wall_mats = {w: wall_material(w) for w in WALLS} if 'walls' in ONLY or 'swatches' in ONLY else {}
    floor_mats = {f: floor_material(f) for f in FLOORS} if 'floors' in ONLY or 'swatches' in ONLY else {}
    all_decor = list(decor.values())

    def flags(obj, catcher=False, holdout=False):
        obj.is_shadow_catcher = catcher; obj.is_holdout = holdout
    for key, (cam, w, h) in cams.items():
        s.camera = cam
        if 'walls' in ONLY:
            setup_render(w, h, transparent=False)
            set_visible(all_decor, False); floor.hide_render = False; skirt.hide_render = False
            flags(floor, holdout=True); flags(wall); flags(skirt, holdout=True)
            for wid, m in wall_mats.items():
                wall.data.materials[0] = m
                render(f'wall-{wid.split(".")[1]}-{key}.webp')
        if 'floors' in ONLY:
            setup_render(w, h, transparent=True)
            set_visible(all_decor, False)
            flags(wall, holdout=True); flags(floor); flags(skirt)
            for fid, m in floor_mats.items():
                floor.data.materials[0] = m
                render(f'floor-{fid.split(".")[1]}-{key}.webp')
        if 'decor' in ONLY:
            setup_render(w, h, transparent=True)
            flags(wall, catcher=True); flags(floor, catcher=True); flags(skirt, catcher=True)
            # Matte catchers: glossy ones would bake reflections of the object into its layer.
            matte = bpy.data.materials.get('catcher') or mat('catcher', '#ffffff', rough=1.0, spec=0.0)
            keep = (wall.data.materials[0], floor.data.materials[0], skirt.data.materials[0])
            for o in (wall, floor, skirt): o.data.materials[0] = matte
            for did, root in decor.items():
                set_visible(all_decor, False); set_visible([root], True)
                flat = did == 'decor.rug'
                flags(floor, catcher=not flat, holdout=flat); flags(wall, catcher=not flat, holdout=flat)
                render(f'decor-{did.split(".")[1]}-{key}.webp')
                if did == 'decor.window':
                    sky = bpy.data.materials['win.sky'].node_tree
                    r = [n for n in sky.nodes if n.type == 'VALTORGB'][0].color_ramp.elements
                    old = [tuple(e.color) for e in r]
                    r[0].color, r[-1].color = lin('#2a3170'), lin('#0d1236')
                    bpy.data.materials['win.cloud'].node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 0.05
                    moon = sphere('moon', 0.2, (0.55 + 0.6, -0.0, 4.35 + 0.6), mat('moon', '#fff3c4', emit='#fff1b8', emit_k=3.0)); moon.parent = None
                    render(f'decor-window-night-{key}.webp')
                    bpy.data.objects.remove(moon, do_unlink=True)
                    for e, c in zip(r, old): e.color = c
                    bpy.data.materials['win.cloud'].node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 0.6
            set_visible(all_decor, True)
            for o, m_ in zip((wall, floor, skirt), keep): o.data.materials[0] = m_
            flags(wall); flags(floor); flags(skirt)

    if 'icons' in ONLY:
        # Shop icons: each decoration alone, slight 3/4 view, auto-framed.
        setup_render(320, 320, samples=None if not FAST else 16, transparent=True)
        wall.hide_render = floor.hide_render = skirt.hide_render = True
        cd = bpy.data.cameras.new('iconcam'); cd.type = 'ORTHO'
        ic = bpy.data.objects.new('iconcam', cd); s.collection.objects.link(ic); s.camera = ic
        for did, root in decor.items():
            set_visible(all_decor, False); set_visible([root], True)
            bpy.context.view_layer.update()
            pts = [o.matrix_world @ Vector(c) for o in root.children_recursive if o.type == 'MESH' for c in o.bound_box]
            mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
            mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
            ctr = (mn + mx) / 2
            d = Vector((0.45, -1, 0.35)).normalized()
            ic.location = ctr + d * 20; look_at(ic, ctr)
            cd.ortho_scale = max(mx.x - mn.x, mx.z - mn.z, (mx.y - mn.y) * 0.8) * 1.25
            render(f'icon/{did}.webp')
        wall.hide_render = floor.hide_render = skirt.hide_render = False

    if 'swatches' in ONLY:
        setup_render(256, 256, samples=None if not FAST else 16, transparent=False)
        set_visible(all_decor, False); skirt.hide_render = True
        cd = bpy.data.cameras.new('swcam'); cd.type = 'ORTHO'; cd.ortho_scale = 2.6
        sc = bpy.data.objects.new('swcam', cd); s.collection.objects.link(sc); s.camera = sc
        flags(floor); flags(wall)
        floor.hide_render = True; wall.hide_render = False
        sc.location = (0, -6, 4); sc.rotation_euler = (math.radians(90), 0, 0)
        for wid, m in wall_mats.items():
            wall.data.materials[0] = m; render(f'swatch/{wid}.webp')
        wall.hide_render = True; floor.hide_render = False
        sc.location = (0, -3, 8); sc.rotation_euler = (math.radians(25), 0, 0)
        for fid, m in floor_mats.items():
            floor.data.materials[0] = m; render(f'swatch/{fid}.webp')

# ── accessories (in the sticker's 100×100 box) ──────────────────────────
ANCHOR = dict(headX=51, headTop=19, eyeY=43, eyeGap=23, neckY=62)
def B(u, v, depth=0.0):
    """Box coords (u right, v down, 0..100) → world (x right, z up); camera looks along +Y."""
    return Vector((u - 50, depth, 50 - v))

def wear_scene():
    clear_scene()
    world('#f2f2f2', 0.6)
    k = light('AREA', 'key', (-40, -60, 60), (0, 0, 0), 60000, '#fff6ea', size=40); look_at(k, (0, 0, 10))
    f = light('AREA', 'fill', (50, -60, 0), (0, 0, 0), 25000, '#e6eeff', size=50); look_at(f, (0, 0, 0))
    r = light('AREA', 'rim', (0, 40, 60), (0, 0, 0), 40000, '#ffffff', size=30); look_at(r, (0, 0, 10))
    cd = bpy.data.cameras.new('wcam'); cd.type = 'ORTHO'; cd.ortho_scale = 100
    cam = bpy.data.objects.new('wcam', cd); bpy.context.scene.collection.objects.link(cam)
    cam.location = (0, -200, 0); cam.rotation_euler = (math.radians(90), 0, 0)
    bpy.context.scene.camera = cam
    cd.clip_end = 1000
    setup_render(640, 640, transparent=True)

def build_wear(id_):
    a = ANCHOR; x = a['headX']; top = a['headTop']; ey = a['eyeY']; g = a['eyeGap']; ny = a['neckY']
    root = empty(id_)
    if id_ == 'hat.party':
        purple = mat('party', '#a855f7', rough=0.35, coat=0.6)
        cone = lathe('party.cone', [(9.5, 0), (0.6, 24), (0, 24.2)], (0, 0, 0), None, parent=root)
        m, nt, p = new_mat('party.stripes'); setp(p, rough=0.35, coat=0.6)
        tc = nt.nodes.new('ShaderNodeTexCoord'); sep = nt.nodes.new('ShaderNodeSeparateXYZ'); link(nt, tc.outputs['Object'], sep.inputs[0])
        stripe = math_(nt, 'LESS_THAN', math_(nt, 'FRACT', math_(nt, 'MULTIPLY', math_(nt, 'ADD', sep.outputs['Z'], math_(nt, 'MULTIPLY', sep.outputs['X'], 0.5)), 0.16)), 0.4)
        link(nt, mix(nt, stripe, '#a855f7', '#fde047'), p.inputs['Base Color'])
        cone.data.materials.append(m)
        sphere('party.pom', 3.4, (0, 0, 25), mat('pom', '#fde047', rough=0.9, sheen=1.0), parent=root)
        torus('party.rim', 9.3, 1.1, (0, 0, 0.5), mat('rim', '#f472b6', rough=0.5), parent=root)
        root.location = B(x, top); root.rotation_euler = (0, math.radians(-12), 0)
    elif id_ == 'hat.beanie':
        red = mat('beanie', '#dc2626', rough=0.85, sheen=0.6)
        dome = lathe('beanie.dome', [(20, 0), (19.5, 8), (16, 16), (9, 21), (0, 22.5)], (0, 0, 0), red, parent=root)
        n = dome.modifiers.new('rib', 'DISPLACE')
        cuff = torus('beanie.cuff', 20, 4.2, (0, 0, 0.5), mat('cuff', '#f8fafc', rough=0.9, sheen=0.8), parent=root)
        cuff.scale = (1, 0.45, 1)
        sphere('beanie.pom', 5.5, (0, 0, 25), mat('pom2', '#f8fafc', rough=1.0, sheen=1.0), parent=root)
        dome.scale = (1, 0.45, 1)
        root.location = B(x, top + 5)
    elif id_ == 'hat.wizard':
        blue = mat('wiz', '#1e3a8a', rough=0.55, sheen=0.5)
        lathe('wiz.brim', [(0, -0.6), (22, -0.6), (22.5, 0), (22, 0.6), (0, 0.6)], (0, 0, 0), blue, parent=root).scale = (1, 0.45, 1)
        cone = lathe('wiz.cone', [(12, 0), (8, 12), (4, 24), (1, 33), (0, 35)], (0, 0, 0), blue, parent=root)
        cone.scale = (1, 0.6, 1)
        bend = cone.modifiers.new('bend', 'SIMPLE_DEFORM'); bend.deform_method = 'BEND'; bend.angle = math.radians(35); bend.deform_axis = 'Y'
        torus('wiz.band', 11.6, 1.4, (0, 0, 2.2), mat('band', '#fde047', metal=0.6, rough=0.3), parent=root).scale = (1, 0.6, 1)
        st = extrude_shape('wiz.star', star_pts(4.2, 1.8), 1.2, (0.5, -7.6, 14), mat('star', '#fde047', metal=0.7, rough=0.25), bevel=0.4, parent=root)
        root.location = B(x, top + 3); root.rotation_euler = (0, math.radians(8), 0)
    elif id_ == 'hat.crown':
        goldm = mat('crown', '#f5b729', metal=1.0, rough=0.2)
        pts = []
        R, n = 15.6, 10
        bm = bmesh.new()
        seg = 80
        ring_lo = []; ring_hi = []
        for i in range(seg):
            a = 2 * math.pi * i / seg
            ph = (i % (seg // n)) / (seg // n)
            hgt = 7 + 12 * (1 - abs(ph - 0.5) * 2) ** 1.6
            ring_lo.append(bm.verts.new((R * math.cos(a), R * 0.5 * math.sin(a), 0)))
            ring_hi.append(bm.verts.new((R * math.cos(a), R * 0.5 * math.sin(a), hgt)))
        for i in range(seg):
            j = (i + 1) % seg
            bm.faces.new((ring_lo[i], ring_lo[j], ring_hi[j], ring_hi[i]))
        cr = to_obj('crown.band', bm, goldm, parent=root)
        sol = cr.modifiers.new('thick', 'SOLIDIFY'); sol.thickness = 1.2
        bv = cr.modifiers.new('bev', 'BEVEL'); bv.width = 0.4; bv.segments = 2
        for i in range(n):
            a = 2 * math.pi * (i + 0.5) / n
            px, py = R * math.cos(a), R * 0.5 * math.sin(a)
            hgt = 19
            if py < 1: sphere('crown.ball', 1.5, (px, py, hgt + 0.8), goldm, parent=root)
        gem_cols = ['#ef4444', '#3b82f6', '#10b981']
        for i, (gx, gc) in enumerate(((-8, gem_cols[1]), (0, gem_cols[0]), (8, gem_cols[2]))):
            sphere('crown.gem', 2.2 if gx == 0 else 1.7, (gx, -8.2, 4.5), mat('gem' + str(i), gc, rough=0.05, coat=1.0, spec=1.0), scale=(1, 0.5, 1), parent=root)
        root.location = B(x, top + 3)
    elif id_ in ('eyes.round', 'eyes.sun', 'eyes.star'):
        cx1, cx2 = x - g / 2, x + g / 2 + 1
        if id_ == 'eyes.round':
            fr = mat('round.frame', '#e9ecef', metal=1.0, rough=0.18)
            for cx in (cx1, cx2):
                torus('round.ring', 8.5, 1.15, B(cx, ey, -8), fr, rot=(math.radians(90), 0, 0))
            br = cyl('round.bridge', 0.9, (cx2 - cx1) - 17, B((cx1 + cx2) / 2, ey - 1.5, -8), fr, seg=16)
            br.rotation_euler = (0, math.radians(90), 0)
            for o in [o for o in bpy.data.objects if o.name.startswith('round.')]: o.parent = root
        elif id_ == 'eyes.sun':
            frame = mat('sun.frame', '#f5b729', metal=1.0, rough=0.2)
            lens = mat('sun.lens', '#111827', rough=0.05, coat=1.0, spec=1.0)
            shape = [(-9.5, 4.5), (9.5, 4.5), (9.2, 0), (7, -4.8), (0, -6.2), (-7, -4.8), (-9.2, 0)]
            for i, cx in enumerate((cx1 - 1, cx2 + 1)):
                pts = [(-px if i == 0 else px, py) for px, py in shape]
                extrude_shape('sun.lens', pts, 1.4, B(cx, ey + 1, -8), lens, bevel=0.5, parent=root)
                outer = [(px * 1.13, py * 1.13 + 0.3) for px, py in pts]
                extrude_shape('sun.rim', outer, 0.9, B(cx, ey + 1, -7.2), frame, bevel=0.3, parent=root)
            br = cyl('sun.bridge', 0.9, 6, B((cx1 + cx2) / 2, ey - 2.5, -8), frame, seg=16, parent=root); br.rotation_euler = (0, math.radians(90), 0)
        else:
            ym = mat('star.frame', '#facc15', rough=0.25, coat=1.0, metal=0.3)
            lens = mat('star.lens', '#fb7185', rough=0.05, coat=1.0)
            for cx in (cx1, cx2):
                extrude_shape('star.f', star_pts(10, 4.6, rot=math.pi / 2), 1.6, B(cx, ey, -8), ym, bevel=0.5, parent=root)
                extrude_shape('star.l', star_pts(7.2, 3.3, rot=math.pi / 2), 1.8, B(cx, ey, -8.4), lens, bevel=0.3, parent=root)
    elif id_ == 'neck.bow':
        red = mat('bow', '#f43f5e', rough=0.4, sheen=0.8, coat=0.3)
        for sx in (-1, 1):
            w_ = lathe('bow.wing', [(0, 0), (2.2, 1), (5, 6), (6.4, 12.6), (0, 13.2)], (0, 0, 0), red, seg=32, parent=root)
            w_.scale = (1, 0.5, 1); w_.rotation_euler = (0, math.radians(90 * sx), 0)
        sphere('bow.knot', 3.2, (0, -1.2, 0), red, scale=(1, 0.7, 1.1), parent=root)
        root.location = B(x, ny, -10)
    elif id_ == 'neck.bell':
        band = torus('bell.band', 22, 2.4, (0, 0, 0), mat('collar', '#ef4444', rough=0.5, coat=0.4), parent=root)
        band.scale = (0.8, 0.4, 0.8); band.rotation_euler = (math.radians(18), 0, 0)
        goldm = mat('bellgold', '#f5b729', metal=1.0, rough=0.15)
        bell = sphere('bell.ball', 5.0, (0, -8.4, -4.6), goldm, parent=root)
        box('bell.slit', (5.2, 2, 0.8), (0, -13.2, -5.6), INK or mat('ink2', '#18181b'), parent=root)
        sphere('bell.hole', 1.0, (0, -13.2, -3.2), INK or mat('ink3', '#18181b'), parent=root)
        torus('bell.loop', 1.6, 0.6, (0, -8.4, 0.6), goldm, rot=(math.radians(90), 0, 0), parent=root)
        root.location = B(x, ny - 1, -4)
    elif id_ == 'neck.scarf':
        blue = mat('scarf', '#3b82f6', rough=0.95, sheen=0.9)
        m, nt, p = new_mat('scarf.knit'); setp(p, rough=0.95, sheen=0.9)
        tc = nt.nodes.new('ShaderNodeTexCoord'); sep = nt.nodes.new('ShaderNodeSeparateXYZ'); link(nt, tc.outputs['Object'], sep.inputs[0])
        stripe = math_(nt, 'LESS_THAN', math_(nt, 'FRACT', math_(nt, 'MULTIPLY', sep.outputs['X'], 0.18)), 0.25)
        link(nt, mix(nt, stripe, '#3b82f6', '#f8fafc'), p.inputs['Base Color'])
        wv = node(nt, 'ShaderNodeTexWave', Scale=1.6, Distortion=0.0); link(nt, tc.outputs['Object'], wv.inputs['Vector']); bump(nt, p, wv.outputs['Factor'], 0.6, 0.4)
        band = torus('scarf.band', 19, 4.4, (0, 0, 0), m, parent=root); band.scale = (1, 0.42, 0.85); band.rotation_euler = (math.radians(16), 0, 0)
        tail = box('scarf.tail', (7, 3, 20), (7.5, -9.5, -10), m, bevel=1.5, parent=root); tail.rotation_euler = (0, math.radians(-10), 0)
        sub = tail.modifiers.new('sub', 'SUBSURF'); sub.levels = 2; sub.render_levels = 2
        for i in range(5):
            cyl('scarf.fringe', 0.55, 3, (4.7 + i * 1.4 + 2.0, -10.5, -21.5), mat('fringe', '#f8fafc', rough=1.0), seg=8, parent=root)
        root.location = B(x, ny, -4)
    return root

WEAR = ['hat.party', 'hat.beanie', 'hat.wizard', 'hat.crown', 'eyes.round', 'eyes.sun', 'eyes.star', 'neck.bow', 'neck.bell', 'neck.scarf']

def render_wear():
    wear_scene()
    global INK
    INK = mat('ink', '#18181b', rough=0.35)
    for wid in WEAR:
        for o in list(bpy.data.objects):
            if o.type not in ('CAMERA', 'LIGHT'): bpy.data.objects.remove(o, do_unlink=True)
        build_wear(wid)
        render(f'wear/{wid}.webp')

# ── league trophies ─────────────────────────────────────────────────────
LEAGUES = [('Bronze', '#c4793b', 'metal'), ('Silver', '#b8c2cc', 'metal'), ('Gold', '#e5a100', 'metal'), ('Sapphire', '#1c8fd6', 'gem'),
           ('Ruby', '#e63946', 'gem'), ('Emerald', '#3aa335', 'gem'), ('Amethyst', '#9d5bd2', 'gem'), ('Pearl', '#f2ece2', 'pearl'),
           ('Obsidian', '#232326', 'obsidian'), ('Diamond', '#9fdcf5', 'diamond')]

def render_trophies():
    clear_scene()
    world('#f4f4f4', 0.7)
    k = light('AREA', 'key', (-3, -5, 6), (0, 0, 0), 900, '#fff4e6', size=4); look_at(k, (0, 0, 1))
    f = light('AREA', 'fill', (4, -4, 2), (0, 0, 0), 400, '#e6eeff', size=5); look_at(f, (0, 0, 1))
    r = light('AREA', 'rim', (0, 4, 5), (0, 0, 0), 900, '#ffffff', size=3); look_at(r, (0, 0, 1.2))
    cd = bpy.data.cameras.new('tcam'); cd.lens = 70
    cam = bpy.data.objects.new('tcam', cd); bpy.context.scene.collection.objects.link(cam)
    cam.location = (2.4, -7.6, 3.2); look_at(cam, (0, 0, 1.15)); bpy.context.scene.camera = cam
    setup_render(512, 512, transparent=True)
    for tier, (name, col, kind) in enumerate(LEAGUES):
        for o in list(bpy.data.objects):
            if o.type not in ('CAMERA', 'LIGHT'): bpy.data.objects.remove(o, do_unlink=True)
        if kind == 'metal': m = mat('t', col, metal=1.0, rough=0.18)
        elif kind == 'gem': m = mat('t', col, metal=0.55, rough=0.12, coat=1.0)
        elif kind == 'pearl': m = mat('t', col, rough=0.25, coat=1.0, sheen=0.6, sss=0.2)
        elif kind == 'obsidian': m = mat('t', col, rough=0.06, coat=1.0, spec=1.0)
        else: m = mat('t', col, metal=0.8, rough=0.05, coat=1.0)
        cup = trophy_cup('cup', m)
        plinth = mat('plinth', '#1d1d20', rough=0.35, coat=0.6)
        box('plinth', (1.5, 1.5, 0.45), (0, 0, -0.225), plinth, bevel=0.06)
        plate = mat('plate', '#e5c158' if tier < 7 else '#e8e8ea', metal=1.0, rough=0.3)
        box('plate', (0.9, 0.04, 0.2), (0, -0.76, -0.22), plate, bevel=0.015)
        if tier >= 2:
            extrude_shape('star', star_pts(0.22, 0.09), 0.06, (0, -0.66, 1.18), mat('starm', '#fff3b0' if kind != 'pearl' else '#e5a100', metal=1.0, rough=0.15), bevel=0.015)
        if tier >= 5:
            for i, gx in enumerate((-0.34, 0.34)):
                sphere('gem', 0.07, (gx, -0.58, 1.3), mat('gm' + str(i), '#ffffff', rough=0.02, coat=1.0, spec=1.0), scale=(1, 0.6, 1))
        if tier == 9:
            for i in range(6):
                a = i / 6 * math.tau
                extrude_shape('spark', star_pts(0.1, 0.03, n=4), 0.02, (math.cos(a) * 1.0, -0.5, 1.4 + math.sin(a) * 0.5), mat('sp', '#ffffff', emit='#ffffff', emit_k=4.0))
        render(f'trophy/{name.lower()}.webp')

def render_bowl():
    clear_scene()
    world('#f4f4f4', 0.7)
    k = light('AREA', 'key', (-3, -5, 6), (0, 0, 0), 700, '#fff4e6', size=4); look_at(k, (0, 0, 0.3))
    f = light('AREA', 'fill', (4, -4, 2), (0, 0, 0), 300, '#e6eeff', size=5); look_at(f, (0, 0, 0.3))
    cd = bpy.data.cameras.new('bcam'); cd.type = 'ORTHO'; cd.ortho_scale = 2.6
    cam = bpy.data.objects.new('bcam', cd); bpy.context.scene.collection.objects.link(cam)
    cam.location = (0, -10, 4.5); look_at(cam, (0, 0, 0.35)); bpy.context.scene.camera = cam
    setup_render(420, 300, transparent=True)
    bpy.context.scene.render.resolution_y = 260
    cd.ortho_scale = 2.4
    red = mat('bowl', '#f43f5e', rough=0.25, coat=0.8)
    lathe('bowl', [(0, 0.02), (0.62, 0.0), (0.72, 0.06), (1.05, 0.5), (1.12, 0.58), (1.06, 0.62), (0.96, 0.52), (0.64, 0.14), (0, 0.12)], (0, 0, 0), red)
    torus('bowl.rim', 1.09, 0.05, (0, 0, 0.6), mat('rimw', '#ffffff', rough=0.3, coat=0.5))
    render('bowl.webp')
    for o in list(bpy.data.objects):
        if o.type not in ('CAMERA', 'LIGHT'): bpy.data.objects.remove(o, do_unlink=True)
    # the meal: a chunky toy fish
    cam.location = (0, -10, 1.5); look_at(cam, (0, 0, 0)); cd.ortho_scale = 2.0
    bpy.context.scene.render.resolution_x = bpy.context.scene.render.resolution_y = 360
    body_m = mat('fish', '#6ec1e4', rough=0.3, coat=0.8)
    belly = mat('fishbelly', '#e6f6fc', rough=0.3, coat=0.8)
    b = sphere('fish.body', 0.5, (0.1, 0, 0), body_m, scale=(1.5, 0.55, 0.9))
    extrude_shape('fish.tail', [(0, 0), (-0.45, 0.4), (-0.35, 0), (-0.45, -0.4)], 0.12, (-0.55, 0, 0), body_m, bevel=0.04)
    extrude_shape('fish.fin', [(0, 0), (-0.3, 0.32), (0.25, 0.05)], 0.06, (0.05, 0, 0.38), body_m, bevel=0.02)
    sphere('fish.belly', 0.42, (0.15, -0.05, -0.15), belly, scale=(1.4, 0.5, 0.55))
    sphere('fish.eye', 0.11, (0.6, -0.22, 0.1), mat('fe', '#ffffff', rough=0.2), scale=(1, 0.6, 1))
    sphere('fish.pupil', 0.06, (0.63, -0.28, 0.1), mat('fp', '#18181b', rough=0.1, coat=1.0), scale=(1, 0.6, 1))
    render('fish.webp')

# ── main ────────────────────────────────────────────────────────────────
if ONLY & {'walls', 'floors', 'decor', 'icons', 'swatches'}: render_room()
if 'wear' in ONLY: render_wear()
if 'trophies' in ONLY: render_trophies()
if 'bowl' in ONLY: render_bowl()
print('ALL DONE', flush=True)
