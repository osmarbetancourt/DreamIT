Astronaut mesh inventory and visor culprits
=========================================

Where: `app/components/canvas/Astronaut.tsx`

Observed meshes (from console logging)
- Group: Sketchfab_Scene
- Object3D: Sketchfab_model, root, GLTF_SceneRootNode, RootNode0_0, skeletal3_6, GLTF_created_0
- Bones: many (Head/Spine/Arms/Legs etc.)
- SkinnedMesh entries (visible meshes):
  - `Object_99` (SkinnedMesh, material_0)
  - `Object_100` (SkinnedMesh, material_0)
  - `Object_103` (SkinnedMesh, material_1)
  - `Object_106` (SkinnedMesh, material_2)
- Misc Object3D: `_3`, `_4`, `_5` and their `_correction` nodes

Bone names (from console logs):
- GLTF_created_0_rootJoint
- Root4_7
- Center5_8
- Spine_16_9
- Spine_27_10
- Spine_38_11
- L_Clevicle9_12 (left clavicle/shoulder)
- L_Arm10_13 (left upper arm)
- L_Elbow11_14
- L_Wrist12_15
- L_thumb_113_16 ... (fingers)
- L_Elbow_1_segment28_31 ... (segments)
- L_Arm_1_segment33_36 ... (segments)
- wire_138_41 ... (wires?)
- neck41_44
- head42_45
- R_Clevicle43_46 (right clavicle)
- R_Arm44_47 (right upper arm)
- R_Elbow45_48
- R_Wrist46_49
- R_thumb_147_50 ... (fingers)
- R_Elbow_1_segment62_65 ... (segments)
- R_Arm_1_segment67_70 ... (segments)
- necklace_172_75 ... (necklace)
- bagPack76_79
- L_bagPackHandle77_80
- R_bagPackHandle78_81
- L_accessories79_82
- R_accessories80_83
- Hip81_84
- L_Thigh82_85
- L_Knee83_86
- L_Ankle84_87
- L_Toe85_88
- L_Toe_End86_89
- L_Knee_spo87_90
- R_Thigh88_91
- R_Knee89_92
- R_Ankle90_93
- R_Toe91_94
- R_Toe_End92_95
- R_Knee_spo93_96

Likely visor culprits
- `Object_99` and `Object_100` are the primary suspects (large SkinnedMesh near the head)
- `Object_103` / `Object_106` are additional visible SkinnedMesh parts worth checking

How to confirm (quick, non-destructive)
1. Visual tint test (temporary): inside the `scene.traverse` loop in `Astronaut.tsx`, add:

```ts
if (child.name === 'Object_99') {
  try {
    if (Array.isArray(child.material)) child.material.forEach((m:any)=>m.color?.set(0xff0000));
    else child.material.color?.set(0xff0000);
    child.material.needsUpdate = true;
  } catch(e){}
}
```

Reload dev server and see if the visor/faceplate turns red. Repeat for `Object_100`, `Object_103`, `Object_106`.

2. Isolation (hide others):

```ts
if (child.name !== 'Object_99') child.visible = false; // show only the candidate
```

Permanent, minimal selector (apply gold only to confirmed mesh)

Inside the existing name-based block in `Astronaut.tsx`, replace the `isVisor` conditional with a direct name match (once confirmed):

```ts
if (child.name === 'Object_99') {
  if (Array.isArray(child.material)) child.material = child.material.map(()=> goldMat);
  else child.material = goldMat;
  child.material.needsUpdate = true;
}
```

Notes & troubleshooting
- If the model has multiple sub-meshes composing the visor, apply the gold material to each `Object_*` confirmed by the tint test.
- If straps/necklace are accidentally matched by fallback heuristics, prefer direct name matching above.
- Keep `logMeshNames={true}` while debugging; remove it in production.

Where I saved this: [app/components/canvas/ASTRONAUT_MESHES.md](app/components/canvas/ASTRONAUT_MESHES.md)
