
import { load } from 'js-yaml'
import { cp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'

const config_dir = join('..', 'configs')
const prod_directory = join('..', 'dist')
await mkdir(prod_directory, { recursive: true })

// The Set() trick is a way to deduplicate the array and then allows us to sort it
const files = await readdir(join(config_dir, 'piracy-list'))
const piracy_hostnames = [...new Set(files.map(path => {
	return basename(join(config_dir, 'piracy-list', path))
}))]

// Somehow not explicitly putting Buffer.from can create errors sometimes
const piracy_json = Buffer.from(JSON.stringify(piracy_hostnames.sort()))
await writeFile(join(prod_directory, 'piracy-repositories.json'), piracy_json)
console.log('wrote %s piracy repositories', piracy_hostnames.length)

type Repository = {
	uri: string
	slug: string
	suite: string
	component?: string
	ranking: number
	aliases?: string[]
}

const index_files = await readdir(join(config_dir, 'index-list'))
const index_data: Repository[] = []

for (const file of index_files) {
	const file_path = join(config_dir, 'index-list', file)
	const entry = load(await readFile(file_path, 'utf8')) as Repository

	if (!entry.suite) {
		entry.suite = './'
	}

	if (entry.slug.includes(' ')) {
		console.log('%s: slug contains a space', entry.slug)
	}

	if (entry.uri.endsWith('/')) {
		entry.uri = entry.uri.slice(0, -1)
	}

	if (entry.component && !entry.suite) {
		console.log('%s: given a component without a suite', entry.slug)
	}

	// We also want to sort individual keys alphabetically too
	const alphabetical = Object.keys(entry).sort().reduce((previous, current) => ({
		...previous, [current]: (entry as { [key: string]: unknown })[current]
	}), {}) as Repository

	index_data.push(alphabetical)
}


index_data.sort((repositoryA, repositoryB) => {
	const slugA = repositoryA.slug.toLowerCase()
	const slugB = repositoryB.slug.toLowerCase()

	// Sorts repositories alphabetically by slug
	return slugA < slugB ? -1 : slugA > slugB ? 1 : 0
}).filter((value, index, array) => {
	// Removes duplicates from the array based on the slug name or URI
	return array.findIndex(subvalue => subvalue.slug === value.slug || subvalue.uri === value.uri) === index
})

// Somehow not explicitly putting Buffer.from can create errors sometimes
const index_json = Buffer.from(JSON.stringify(index_data))
await writeFile(join(prod_directory, 'index-repositories.json'), index_json)
console.log('wrote %s index repositories', index_data.length)

// Copy some final files before delegating publishing to Github Actions
await cp(resolve('canister.png'), join(prod_directory, 'canister.png'))
await cp(resolve('index.html'), join(prod_directory, 'index.html'))
await cp(resolve('404.html'), join(prod_directory, '404.html'))
