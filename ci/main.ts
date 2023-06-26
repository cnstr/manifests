import { cp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'
import { parse } from 'yaml'

const configsPath = join('..', 'configs')
const outputPath = join('..', 'dist')
await mkdir(outputPath, { recursive: true })
console.log('> Generating output files...')

const piracyFiles = await readdir(join(configsPath, 'piracy-list'))
const piracyEndpoints = piracyFiles
	.map(path => basename(join(configsPath, 'piracy-list', path)))
	.filter((host, index, array) => {
		// Filter out potential duplicates and warn
		if (array.indexOf(host) !== index) {
			console.log('! %s: duplicate piracy hostname', host)
			return false
		}

		return true
	})
	.sort() // Sort alphabetically

// Generate the buffer for the output file
const piracyFile = Buffer.from(JSON.stringify(piracyEndpoints))
await writeFile(join(outputPath, 'piracy-repositories.json'), piracyFile)
console.log('> Wrote %s piracy repositories', piracyEndpoints.length)

type Repository = {
	uri: string;
	slug: string;
	suite: string;
	bootstrap: boolean;
	component?: string;
	binary?: string;
	ranking: number;
	aliases?: string[];
}

const indexFiles = await readdir(join(configsPath, 'index-list'))
const indexData = new Array<Repository>()

for await (const file of indexFiles) {
	const filePath = join(configsPath, 'index-list', file)
	const fileData = await readFile(filePath, 'utf8')
	const entry = parse(fileData) as Repository

	if (!entry.suite) {
		entry.suite = './'
	}

	if (!entry.bootstrap) {
		entry.bootstrap = false
	}

	if (entry.slug.includes(' ')) {
		console.log('! %s: slug contains a space', entry.slug)
		continue
	}

	if (!entry.slug.match(/^[a-zA-Z0-9-_.]+$/)) {
		console.log('! %s: slug contains invalid characters', entry.slug)
		continue
	}

	if (entry.uri.endsWith('/')) {
		entry.uri = entry.uri.slice(0, -1)
	}

	if (entry.component && !entry.suite) {
		console.log('! %s: given a component without a suite', entry.slug)
		continue
	}

	if (entry.component && !entry.binary) {
		console.log('! %s: given a component without a binary', entry.slug)
		continue
	}

	// We also want to sort individual keys alphabetically too
	const alphabetical = Object.fromEntries(Object.keys(entry)
		.sort()
		.map(current => [current, (entry as Record<string, unknown>)[current]])) as Repository

	indexData.push(alphabetical)
}

indexData.sort((repositoryA, repositoryB) => {
	const slugA = repositoryA.slug.toLowerCase()
	const slugB = repositoryB.slug.toLowerCase()

	// Sorts repositories alphabetically by slug
	return slugA < slugB ? -1 : (slugA > slugB ? 1 : 0)
})
	.filter((value, index, array) =>
	// Removes duplicates from the array based on the slug name or URI
		array.findIndex(subvalue => subvalue.slug === value.slug || subvalue.uri === value.uri) === index
	)

const indexFile = Buffer.from(JSON.stringify(indexData))
await writeFile(join(outputPath, 'index-repositories.json'), indexFile)
console.log('> Wrote %s index repositories', indexData.length)

// Copy some final files before delegating publishing to Github Actions
await cp(resolve('canister.png'), join(outputPath, 'canister.png'))
await cp(resolve('index.html'), join(outputPath, 'index.html'))
await cp(resolve('index.html'), join(outputPath, '404.html'))
