const test = require("node:test");
const assert = require("node:assert/strict");
require("tsx/cjs");

const { getVideoEmbed } = require("../lib/video.ts");
const vimeoEmbed = "https://player.vimeo.com/video/123456789";

test("Vimeo sharing URLs become player URLs", () => {
  for (const url of [
    "https://vimeo.com/123456789",
    "https://www.vimeo.com/123456789?utm_source=share",
    "https://vimeo.com/channels/staffpicks/123456789",
    "https://vimeo.com/groups/documentary/videos/123456789",
    "https://vimeo.com/showcase/987654/video/123456789",
    "https://vimeo.com/album/987654/video/123456789",
    "https://player.vimeo.com/video/123456789?autoplay=1"
  ]) {
    assert.deepEqual(getVideoEmbed(url), { provider: "vimeo", embedUrl: vimeoEmbed }, url);
  }
});

test("Vimeo privacy hashes survive shared and player URLs", () => {
  for (const url of [
    "https://vimeo.com/123456789/abcdef1234",
    "https://vimeo.com/123456789?h=abcdef1234&utm_source=share",
    "https://player.vimeo.com/video/123456789?h=abcdef1234&autoplay=1"
  ]) {
    assert.deepEqual(getVideoEmbed(url), {
      provider: "vimeo",
      embedUrl: `${vimeoEmbed}?h=abcdef1234`
    }, url);
  }
});

test("unsupported Vimeo paths and invalid IDs or hashes are rejected", () => {
  for (const url of [
    "https://vimeo.com/manage/videos/123456789",
    "https://vimeo.com/showcase/987654/123456789",
    "https://vimeo.com/123456789/extra/path",
    "https://player.vimeo.com/video/123456789/extra",
    "https://vimeo.com/12345",
    "https://vimeo.com/123456789/invalid-hash",
    "https://player.vimeo.com/video/123456789?h=invalid-hash",
    "https://player.vimeo.com/video/123456789?h=",
    "https://vimeo.com/123456789/abcdef1234?h=123456abcd",
    "https://vimeo.com/123456789?h=abcdef1234&h=123456abcd"
  ]) {
    assert.equal(getVideoEmbed(url), null, url);
  }
});

test("only exact video hosts and web protocols are accepted", () => {
  for (const url of [
    "https://vimeo.com.evil.example/123456789",
    "https://player.vimeo.com.evil.example/video/123456789",
    "javascript:https://vimeo.com/123456789",
    "ftp://vimeo.com/123456789",
    "not a URL",
    ""
  ]) {
    assert.equal(getVideoEmbed(url), null, url);
  }
  assert.equal(getVideoEmbed(null), null);
  assert.equal(getVideoEmbed(undefined), null);
});

test("existing YouTube links still map to the privacy-enhanced player", () => {
  const embed = { provider: "youtube", embedUrl: "https://www.youtube-nocookie.com/embed/abcdefghijk" };
  assert.deepEqual(getVideoEmbed("https://www.youtube.com/watch?v=abcdefghijk&t=10"), embed);
  assert.deepEqual(getVideoEmbed("https://youtu.be/abcdefghijk"), embed);
});
