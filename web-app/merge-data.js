import fs from 'fs';
import path from 'path';

const dataDir = './data/rules/lifepaths';
const outputFile = './public/master_rules.json';

const masterRules = {
    lifepaths: {}
}

try {
    const stocks = fs.readdirSync(dataDir);

    stocks.forEach(stock => {
        const stockPath = path.join(dataDir, stock);

        if (fs.statSync(stockPath).isDirectory()) {
            if (!masterRules.lifepaths[stock]) {
                masterRules.lifepaths[stock]  ={};

                const settingFiles = fs.readdirSync(stockPath);

                settingFiles.forEach(file => {
                    if (file.endsWith('.json')) {
                        const settingName = path.basename(file, '.json')

                        const filePath = path.join(stockPath, file);
                        const rawData = fs.readFileSync(filePath, 'utf8');
                        const parsedData = JSON.parse(rawData);

                        masterRules.lifepaths[stock][settingName] = parsedData;
                    }
                });
            }
        }
    });

    fs.writeFileSync(outputFile, JSON.stringify(masterRules, null, 2));
    console.log('Master rules successfully compiled.')
} catch (error) {
    console.error('Error while compiling rules', error.message)
}

