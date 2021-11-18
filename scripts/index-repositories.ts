import { writeFile } from 'fs'
import { join } from 'path'
import * as json from '../manifests/index-repositories.json'

type RepositoryManifest = {
	uri: string
	slug: string
	dist?: string
	suite?: string
	ranking: number
	aliases?: string[]
}[]

const data: RepositoryManifest = json.sort((repositoryA, repositoryB) => {
	const slugA = repositoryA.slug.toLowerCase()
	const slugB = repositoryB.slug.toLowerCase()

	// Sorts repositories alphabetically by slug
	return slugA < slugB ? -1 : slugA > slugB ? 1 : 0
}).filter((value, index, array) => {
	// Removes duplicates from the array based on the slug name
	return array.findIndex(subvalue => subvalue.slug === value.slug) === index
})

const write = JSON.stringify(data.map(entry => {
	if (entry.slug.includes(' ')) {
		console.log('%s: space found in slug', entry.slug)
		return
	}

	if (entry.uri.endsWith('/')) {
		entry.uri = entry.uri.slice(0, -1)
	}

	if (entry.dist && !entry.suite) {
		console.log('%s: given dist without suite', entry.slug)
	}

	if (entry.suite && !entry.dist) {
		console.log('%s: given suite without dist', entry.slug)
	}

	// We also want to sort individual keys alphabetically too
	const alphabetical = Object.keys(entry).sort().reduce((previous, current) => ({
		...previous, [current]: (entry as { [key: string]: unknown })[current]
	}), {})

	return alphabetical
}).filter(Boolean)) // Filters out empty entries that were omitted

writeFile(join('production', 'index-repositories.json'), Buffer.from(write), 'utf8', (error) => {
	if (error) console.log('Encountered an error: %s', error.message)
})

console.log('Repository Count: %s', data.length)
console.log('Wrote production manifest file')
