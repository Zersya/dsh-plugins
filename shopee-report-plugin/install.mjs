#!/usr/bin/env node
/** Pasang plugin ke profil `web` (idempoten, dengan backup). Jalankan: node install.mjs */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const here = path.dirname(new URL(import.meta.url).pathname)
const profileName = process.argv[2] || 'web'
const profile = path.join(os.homedir(), '.dsh', 'profiles', profileName)
const pkgFile = path.join(profile, 'package.json')
const PKG = '@local/dsh-shopee-report'

const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'))
pkg.dependencies = pkg.dependencies || {}
if (pkg.dependencies[PKG] === `link:${here}`) {
  console.log('dependency sudah ada')
} else {
  fs.copyFileSync(pkgFile, pkgFile + '.bak-before-shopee')
  pkg.dependencies[PKG] = `link:${here}`
  const bundles = (pkg.dsh?.profile?.bundles) || []
  if (!bundles.includes(PKG)) bundles.push(PKG)
  pkg.dsh = pkg.dsh || {}
  pkg.dsh.profile = pkg.dsh.profile || {}
  pkg.dsh.profile.bundles = bundles
  fs.writeFileSync(pkgFile, JSON.stringify(pkg, null, 2) + '\n')
  console.log('package.json diperbarui (backup .bak-before-shopee)')
}
const lock = path.join(profile, 'pnpm-lock.yaml')
if (fs.existsSync(lock)) fs.copyFileSync(lock, lock + '.bak-before-shopee')
execFileSync('pnpm', ['install'], { cwd: profile, stdio: 'inherit' })
console.log(`\nSelesai. Reload halaman DSH (profil ${profileName}), lalu buka entri "Shopee" di sidebar.`)
