const fetch = require('node-fetch');
const cheerio = require('cheerio');
const minimist = require('minimist');

const args = minimist(process.argv.slice(2), {
    string: 'format',           // --format markdown, csv, html, quizlet
    alias: { f: 'format' }
})

async function fetchProductList() {
    return fetch('https://azure.microsoft.com/en-us/services/')
        .then(response => response.text())
        .then(data => {
            const products = [];
            let currentCategory = null;
            const $ = cheerio.load(data);
            const proudctRows = $('#products-list').children();
            proudctRows.each(function () {
                const e = $(this);
                if (e.has('.product-category').length > 0) {
                    currentCategory = e.find('.product-category').text();
                } else {
                    const entries = e.find('[data-event="area-products-index-clicked-product"]');
                    entries.each(function () {
                        const p = $(this);
                        const productEntry = {
                            name: p.find('h2').text(),
                            description: p.next().text(),
                            category: currentCategory,
                            url: `https://azure.microsoft.com${p.attr('href')}`
                        };
                        products.push(productEntry);
                    })


                }
            });
            return products;
        })
        .catch(err => console.error(err))

}

function formatOutput(productList) {
    switch (args.format) {
        case 'markdown':
            return `# Azure Product Catalog
|Category|Product|Description|Link|
|----------|-------------|------|-----|
${productList.map(p => `|${p.category}|${p.name}|${p.description}|${p.url}|`).join('\n')}
`;
        case 'html':
            return `<h1>Azure Product Catalog</h1>  
<table>
<tr><th>Category</th><th>Product</th><th>Description</th><th>Link</th></tr>
${productList.map(p => `<tr><td>${p.category}</td><td>${p.name}</td><td>${p.description}</td><td>${p.url}</td><td>`).join('\n')}
</table>
`;
        case 'quizlet':
            return `${productList.map(p => `${p.description}\t${p.name}`).join('\n')}`;
        default:
            return `${productList.map(p => `"${p.category}","${p.name}","${p.description}","${p.url}"`).join('\n')} `;
    };
}

fetchProductList().then(z => console.log(formatOutput(z)));