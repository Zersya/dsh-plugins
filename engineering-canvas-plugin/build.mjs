import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const parts = [
  '00-core.js',
  '10-canvas.js',
  '15-nodes.js',
  '20-inspector.js',
  '25-note-editor.js',
  '30-styles.js',
  '40-apply.js',
].map((name) => fs.readFileSync(path.join(root, 'src', name), 'utf8'))

const header = `window.__ModuleLoader__.load({
  id: '@local/engineering-canvas',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { Fragment, useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } = React
`
const footer = `
    return { inject: ['slots', 'locale'], apply }
  },
})
`

fs.writeFileSync(path.join(root, 'client.js'), `${header}${parts.join('\n')}${footer}`)
console.log(`built client.js (${fs.statSync(path.join(root, 'client.js')).size} bytes)`)
