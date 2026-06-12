import fs from 'fs';
import path from 'path';

const lifepathsDir = './data/rules/lifepaths';
const agesDir = './data/rules/ages';
const outputFile = './public/master_rules.json';

const masterRules = {
    lifepaths: {},
    ages: {}
};

try {
    if (fs.existsSync(lifepathsDir)) {
        const stocks = fs.readdirSync(lifepathsDir);

        stocks.forEach(stock => {
            const stockPath = path.join(lifepathsDir, stock);

            if (fs.statSync(stockPath).isDirectory()) {
                if (!masterRules.lifepaths[stock]) {
                    masterRules.lifepaths[stock] = {};

                    const settingFiles = fs.readdirSync(stockPath);

                    settingFiles.forEach(file => {
                        if (file.endsWith('.json')) {
                            const settingName = path.basename(file, '.json');
                            const filePath = path.join(stockPath, file);
                            const rawData = fs.readFileSync(filePath, 'utf8');
                            const parsedData = JSON.parse(rawData);

                            masterRules.lifepaths[stock][settingName] = parsedData;
                        }
                    });
                }
            }
        });
    }

    if (fs.existsSync(agesDir)) {
        const ageFiles = fs.readdirSync(agesDir);

        ageFiles.forEach(file => {
            if (file.endsWith('.json')) {

                const stockName = path.basename(file, '.json'); 
                const filePath = path.join(agesDir, file);
                const rawData = fs.readFileSync(filePath, 'utf8');
                const parsedData = JSON.parse(rawData);

                masterRules.ages[stockName] = parsedData;
            }
        });
        console.log('Age charts successfully integrated.');
    } else {
        console.warn(`Warning: Age directory not found at ${agesDir}. Skipping age table compilation.`);
    }

    fs.writeFileSync(outputFile, JSON.stringify(masterRules, null, 2));
    console.log('Master rules successfully compiled.');

} catch (error) {
    console.error('Error while compiling rules:', error.message);
}