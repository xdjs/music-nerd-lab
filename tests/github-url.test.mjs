import test from 'node:test';
import assert from 'node:assert/strict';
import {githubUrl} from '../src/github-url.js';
test('preserves repository and branch links',()=>{
  for(const url of ['https://github.com/xdjs/medellin-metal','https://github.com/xdjs/music-nft-era/tree/codex/opening-chapter']) assert.equal(githubUrl(url),url);
});
test('does not label starting sources or invalid URLs as GitHub',()=>{
  for(const url of [undefined,'','https://www.instagram.com/p/example/','https://github.com/xdjs','https://github.com.evil.test/xdjs/repo','javascript:alert(1)','https://user:pass@github.com/xdjs/repo']) assert.equal(githubUrl(url),'');
});
