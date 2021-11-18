import { writeFile } from 'fs'
import { join } from 'path'
import * as json from '../manifests/piracy-repositories.json'

const data: string[] = [...new Set(json.sort())]
const write = JSON.stringify(data)

writeFile(join('production', 'piracy-repositories.json'), Buffer.from(write), 'utf8', (error) => {
	if (error) console.log('Encountered an error: %s', error.message)
})

console.log('Piracy Count: %s', data.length)
console.log('Wrote production manifest file')
