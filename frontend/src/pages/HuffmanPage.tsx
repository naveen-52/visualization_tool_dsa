import React, { useState } from 'react';
import { 
  Binary, 
  Play, 
  Copy, 
  Check, 
  FileText, 
  Table, 
  Loader2, 
  Sparkles
} from 'lucide-react';
import { apiHuffmanEncode, apiHuffmanDecode } from '../api/client';
import { HuffmanEncodeResponse, HuffmanDecodeResponse } from '../types';

export const HuffmanPage: React.FC = () => {
  const [inputText, setInputText] = useState('ALGORITHM VISUALIZER');
  const [encodeResult, setEncodeResult] = useState<HuffmanEncodeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Decoder state
  const [decodeInput, setDecodeInput] = useState('');
  const [decodeResult, setDecodeResult] = useState<HuffmanDecodeResponse | null>(null);
  const [decoding, setDecoding] = useState(false);

  const presets = [
    'ALGORITHM VISUALIZER',
    'NEC COMPUTER SCIENCE',
    'LOSSLESS DATA COMPRESSION',
    'BEEP BOOP BEER'
  ];

  const handleEncode = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setDecodeResult(null);
    try {
      const res = await apiHuffmanEncode(inputText);
      setEncodeResult(res);
      if (res.encoded) {
        setDecodeInput(res.encoded);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDecode = async () => {
    if (!decodeInput || !encodeResult?.codes) return;
    setDecoding(true);
    try {
      const res = await apiHuffmanDecode(decodeInput, encodeResult.codes);
      setDecodeResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setDecoding(false);
    }
  };

  const handleCopyBitstream = () => {
    if (encodeResult?.encoded) {
      navigator.clipboard.writeText(encodeResult.encoded);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const totalChars = inputText.length;

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Binary className="w-4 h-4" />
            <span>Information Theory & Compression</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">
            Huffman Coding Studio
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Generate optimal prefix-free codes, measure bit efficiency, and step through binary decoding.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => setInputText(p)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Input Section */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-400" />
            <span>Source Text String</span>
          </label>
          <span className="text-xs text-slate-500 font-mono">
            {inputText.length} characters ({inputText.length * 8} bits uncompressed)
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type text to compress..."
            className="flex-1 px-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-mono"
          />
          <button
            onClick={handleEncode}
            disabled={loading || !inputText.trim()}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/30 disabled:opacity-50 transition-all shrink-0"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Compressing...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Build Huffman Tree</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Compression Metrics Banner */}
      {encodeResult && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-slate-400 uppercase tracking-wider block">Raw ASCII Bits</span>
              <div className="text-2xl font-black text-white mt-1">
                {encodeResult.original_bits} <span className="text-xs font-normal text-slate-500">bits</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-purple-400 uppercase tracking-wider block">Huffman Bits</span>
              <div className="text-2xl font-black text-purple-300 mt-1">
                {encodeResult.compressed_bits} <span className="text-xs font-normal text-slate-500">bits</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-emerald-400 uppercase tracking-wider block">Space Savings</span>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                {encodeResult.original_bits && encodeResult.compressed_bits
                  ? `${Math.max(
                      0,
                      Math.round(
                        (1 - encodeResult.compressed_bits / encodeResult.original_bits) * 100
                      )
                    )}%`
                  : '0%'}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs text-blue-400 uppercase tracking-wider block">Compression Ratio</span>
              <div className="text-2xl font-black text-blue-300 mt-1">
                {encodeResult.compression_ratio ? encodeResult.compression_ratio.toFixed(2) : '1.00'}x
              </div>
            </div>
          </div>

          {/* Encoded Bitstream Viewer */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Binary className="w-4 h-4 text-purple-400" />
                <span>Generated Bitstream</span>
              </span>
              <button
                onClick={handleCopyBitstream}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Bits'}</span>
              </button>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs text-purple-300 break-all leading-relaxed max-h-32 overflow-y-auto">
              {encodeResult.encoded}
            </div>
          </div>

          {/* Frequency & Codebook Table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Table className="w-4 h-4 text-purple-400" />
                  <span>Prefix Code Mapping Table</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  {Object.keys(encodeResult.codes || {}).length} unique characters
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/70">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">Character</th>
                      <th className="px-4 py-2.5 font-semibold">Frequency</th>
                      <th className="px-4 py-2.5 font-semibold">Probability</th>
                      <th className="px-4 py-2.5 font-semibold">Binary Codeword</th>
                      <th className="px-4 py-2.5 font-semibold text-right">Length</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {Object.entries(encodeResult.codes || {}).map(([char, code]) => {
                      const freq = encodeResult.frequencies?.[char] || 1;
                      const prob = totalChars > 0 ? ((freq / totalChars) * 100).toFixed(1) : '0';
                      return (
                        <tr key={char} className="hover:bg-slate-900/40">
                          <td className="px-4 py-2 font-mono font-bold text-purple-300">
                            {char === ' ' ? '<SPACE>' : char}
                          </td>
                          <td className="px-4 py-2 text-slate-300 font-mono">{freq}</td>
                          <td className="px-4 py-2 text-slate-400">{prob}%</td>
                          <td className="px-4 py-2 font-mono font-bold text-emerald-400">{code}</td>
                          <td className="px-4 py-2 text-slate-400 font-mono text-right">{code.length}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Interactive Bitstream Decoder */}
            <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Binary className="w-4 h-4 text-emerald-400" />
                <span>Test Huffman Decoder</span>
              </span>
              <p className="text-xs text-slate-400">
                Input or edit a bitstream to verify prefix-free tree decoding back into text:
              </p>

              <textarea
                rows={3}
                value={decodeInput}
                onChange={(e) => setDecodeInput(e.target.value)}
                placeholder="Paste binary bitstream (e.g. 010110)..."
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-purple-300 focus:outline-none focus:border-purple-500"
              />

              <button
                onClick={handleDecode}
                disabled={decoding || !decodeInput}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all"
              >
                {decoding ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Decoding Bitstream...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Decode Binary Stream</span>
                  </>
                )}
              </button>

              {decodeResult && (
                <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-1">
                  <span className="text-[11px] font-semibold uppercase text-emerald-400 tracking-wider">
                    Decoded Output String:
                  </span>
                  <div className="text-sm font-mono font-bold text-white break-words">
                    {decodeResult.decoded || '<Empty result>'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
