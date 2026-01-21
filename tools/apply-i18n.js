/**
 * apply-i18n.js
 * Scans HTML files and inserts data-translate / data-translate-placeholder attributes,
 * collects strings, and writes a merge snippet file (merge_snippet.js) for appending to main.js.
 */
const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const cheerio = require('cheerio');
const slugify = require('slugify');

const ROOT = process.cwd();

function isSkippable(tag) {
  const s = new Set(['script','style','noscript','code','pre','svg','path','iframe','meta','link']);
  return s.has((tag||'').toLowerCase());
}

function generateKey(relPath, text, existing) {
  const short = text.replace(/\s+/g,' ').trim().slice(0,40);
  let base = `${relPath.replace(/[\/\\]/g,'_')}_${slugify(short, {lower:true,strict:true})}`;
  base = base.replace(/_+/g,'_').replace(/^_|_$/g,'');
  let key = base;
  let i = 1;
  while (existing.has(key)) key = `${base}_${i++}`;
  existing.add(key);
  return key;
}

async function main() {
  const patterns = [
    'pages/index/section_0*.html',
    'pages/**/*.html',
    'pages/index/**/*.html',
    'pages/plumbing/**/*.html',
    'pages/errors/**/*.html',
    'pages/components/**/*.html',
    'pages/index/components/**/*.html',
    'pages/errors/components/**/*.html',
    'pages/errors/codes/**/*.html'
  ];
  const files = new Set();
  for (const p of patterns) {
    glob.sync(p, {cwd: ROOT, nodir:true}).forEach(f => files.add(path.join(ROOT,f)));
  }
  const translations = { fr: {}, en: {} };
  const existingKeys = new Set();

  // scan main.js to seed existing keys
  const mainJs = path.join(ROOT,'assets','scripts','main.js');
  if (fs.existsSync(mainJs)) {
    const mj = fs.readFileSync(mainJs,'utf8');
    const re = /['"]([a-zA-Z0-9_\-\.]+)['"]\s*:/g;
    let m;
    while ((m=re.exec(mj))!==null) existingKeys.add(m[1]);
  }

  for (const f of files) {
    try {
      const html = await fs.readFile(f,'utf8');
      const $ = cheerio.load(html, {decodeEntities:false});
      let changed = false;

      // placeholders
      $('input[placeholder],textarea[placeholder]').each((i,el)=>{
        const $el = $(el);
        if ($el.attr('data-translate-placeholder')) return;
        const ph = ($el.attr('placeholder')||'').trim();
        if (!ph) return;
        const key = generateKey(path.relative(ROOT,f), `ph_${ph}`, existingKeys);
        $el.attr('data-translate-placeholder', key);
        translations.fr[key] = ph;
        translations.en[key] = ph;
        changed = true;
      });

      // simple tags
      const tags = ['a','button','h1','h2','h3','h4','h5','h6','p','span','label','li','small','strong'];
      tags.forEach(tag=>{
        $(tag).each((i,el)=>{
          const $el = $(el);
          if ($el.attr('data-translate')) return;
          const children = $el.contents().toArray();
          const onlyText = children.every(ch => ch.type==='text' || (ch.type==='tag' && ['span','strong','em','b','i'].includes(ch.name)));
          if (!onlyText) return;
          const text = $el.text().trim();
          if (!text || text.length<2) return;
          if (/^[\s\+\d\(\)\-\.@]+$/.test(text)) return;
          const key = generateKey(path.relative(ROOT,f), text, existingKeys);
          $el.attr('data-translate', key);
          translations.fr[key] = text;
          translations.en[key] = text;
          changed = true;
        });
      });

      // deep text nodes fallback
      function collectTextNodes(node, results){
        node.contents().each((i,el)=>{
          if (el.type==='text') {
            const txt = (''+el.data).trim();
            if (txt && txt.length>=2 && !/^[\d\W]+$/.test(txt)) results.push({parent: node, text: txt});
          } else if (el.type==='tag' && !isSkippable(el.name)) {
            const $el = $(el);
            if ($el.attr('data-translate')) return;
            collectTextNodes($el, results);
          }
        });
      }
      const results = [];
      collectTextNodes($.root(), results);
      for (const it of results) {
        const $p = it.parent;
        if ($p.attr('data-translate')) continue;
        const txt = it.text;
        if (!txt || txt.length<2) continue;
        const key = generateKey(path.relative(ROOT,f), txt, existingKeys);
        $p.attr('data-translate', key);
        translations.fr[key] = txt;
        translations.en[key] = txt;
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(f, $.html(), 'utf8');
        console.log('Updated:', f);
      }
    } catch (e) {
      console.error('Error processing', f, e.message || e);
    }
  }

  // produce merge snippet file
  const esc = s => s.replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\r?\n/g,'\\n');
  const frPairs = Object.entries(translations.fr).map(([k,v])=> `  '${k}': '${esc(v)}'`).join(',\n');
  const enPairs = Object.entries(translations.en).map(([k,v])=> `  '${k}': '${esc(v)}'`).join(',\n');
  const snippet = `\n/* Auto-generated translation merges (apply-i18n.js) */\nif (typeof Language !== 'undefined' && Language.translations) {\n  try {\n    Object.assign(Language.translations.fr, {\n${frPairs}\n    });\n    Object.assign(Language.translations.en, {\n${enPairs}\n    });\n    if (Language.apply) setTimeout(()=>{ try{ Language.apply(); }catch(e){console.error('apply error',e);} }, 200);\n  } catch(e) { console.error('merge failed', e); }\n}\n`;
  const out = path.join(ROOT, 'tools', 'merge_snippet.js');
  fs.writeFileSync(out, snippet, 'utf8');
  console.log('Wrote merge snippet to', out);
}
main().catch(e=>{ console.error(e); process.exit(1); });
