import { writeFile } from 'fs'
import { join } from 'path'
import { exit } from 'process'
import * as json from '../manifests/piracy-repositories.json'

const mode = process.env.MODE ?? 'none'
const write: string[] = [...new Set(json.sort())]

if (mode === 'ci') {
	writeFile(join('production', 'piracy-repositories.json'), Buffer.from(JSON.stringify(write)), 'utf8', (error) => {
		if (error) {
			console.log('[CI] Encountered an error: %s', error.message)
			exit(-1) // Fail GitHub Actions
		}
	})
}

if (mode === 'husky') {
	writeFile(join('manifests', 'piracy-repositories.json'), Buffer.from(JSON.stringify(write, undefined, '\t')), 'utf8', (error) => {
		if (error) {
			console.log('[Husky] Encountered an error: %s', error.message)
			return
		}
	})
}
