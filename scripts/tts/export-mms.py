"""
Convert an official Meta MMS-TTS checkpoint (Hugging Face `facebook/mms-tts-*`, VITS)
into a sherpa-onnx-compatible ONNX model (inputs x, x_length, noise_scale,
length_scale, noise_scale_w; output y) plus tokens.txt.

Usage: python export-mms.py <hf-repo-id> <out-dir>
Needs: torch, transformers, onnx (only at install time, never at runtime).
Only the model files are downloaded from the official Hugging Face repo.
"""
import json, os, sys, urllib.request

repo, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
src = os.path.join(out, '_hf')
os.makedirs(src, exist_ok=True)
for name in ['config.json', 'vocab.json', 'tokenizer_config.json', 'special_tokens_map.json', 'model.safetensors']:
    dest = os.path.join(src, name)
    if not os.path.exists(dest):
        print('downloading', repo, name, flush=True)
        urllib.request.urlretrieve(f'https://huggingface.co/{repo}/resolve/main/{name}', dest)

import torch, onnx
from transformers import VitsModel

model = VitsModel.from_pretrained(src).eval()
cfg = model.config

class Wrapper(torch.nn.Module):
    def __init__(self, m):
        super().__init__()
        self.m = m
    def forward(self, x, x_length, noise_scale, length_scale, noise_scale_w):
        self.m.noise_scale = noise_scale
        self.m.noise_scale_duration = noise_scale_w
        self.m.speaking_rate = 1.0 / length_scale
        mask = (torch.arange(x.shape[1]).unsqueeze(0) < x_length.unsqueeze(1)).long()
        wave = self.m(input_ids=x, attention_mask=mask).waveform
        return wave.unsqueeze(1)

w = Wrapper(model)
x = torch.tensor([[0, 5, 0, 7, 0, 9, 0, 11, 0, 13, 0]], dtype=torch.long)
args = (x, torch.tensor([x.shape[1]]), torch.tensor([0.667]), torch.tensor([1.0]), torch.tensor([0.8]))
onnx_path = os.path.join(out, 'model.onnx')
torch.onnx.export(
    w, args, onnx_path, opset_version=17, dynamo=False,
    input_names=['x', 'x_length', 'noise_scale', 'length_scale', 'noise_scale_w'],
    output_names=['y'],
    dynamic_axes={'x': {0: 'N', 1: 'L'}, 'x_length': {0: 'N'}, 'y': {0: 'N', 2: 'T'}},
)

vocab = json.load(open(os.path.join(src, 'vocab.json'), encoding='utf-8'))
with open(os.path.join(out, 'tokens.txt'), 'w', encoding='utf-8', newline='\n') as f:
    for tok, idx in sorted(vocab.items(), key=lambda kv: kv[1]):
        f.write(f'{tok} {idx}\n')

m = onnx.load(onnx_path)
meta = {
    'model_type': 'vits', 'comment': 'mms', 'language': repo.split('mms-tts-')[-1],
    'add_blank': '1' if getattr(cfg, 'add_blank', True) else '0', 'n_speakers': '1',
    'sample_rate': str(cfg.sampling_rate), 'punctuation': '', 'frontend': 'characters',
}
for k, v in meta.items():
    e = m.metadata_props.add(); e.key = k; e.value = v
onnx.save(m, onnx_path)
print('wrote', onnx_path, 'sample_rate', cfg.sampling_rate, 'add_blank', meta['add_blank'])
