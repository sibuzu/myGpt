const fs = require('fs').promises;
const path = require('path');

async function convertImageToBase64(filePath) {
    try {
        const imageBuffer = await fs.readFile(filePath);
        const ext = path.extname(filePath).toLowerCase();
        let mimeType;
        switch (ext) {
            case '.png':
                mimeType = 'image/png';
                break;
            case '.jpg':
            case '.jpeg':
                mimeType = 'image/jpeg';
                break;
            case '.gif':
                mimeType = 'image/gif';
                break;
            case '.webp':
                mimeType = 'image/webp';
                break;
            case '.bmp':
                mimeType = 'image/bmp';
                break;
            default:
                console.error(`Unsupported image format: ${ext}`);
                return null;
        }
        
        return `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.error(`File not found: ${filePath}`);
        } else {
            console.error(`Error reading image file ${filePath}:`, error.message);
        }
        return null;
    }
}

async function processScript(scriptPath) {
    try {
        const scriptContent = await fs.readFile(scriptPath, 'utf8');
        const script = JSON.parse(scriptContent);
        const scriptDir = path.dirname(scriptPath);
        
        let totalFiles = 0;
        let successCount = 0;

        for (const item of script) {
            if (item.files && item.files.length > 0) {
                item.images = [];
                totalFiles += item.files.length;
                
                for (const filePath of item.files) {
                    const absolutePath = path.isAbsolute(filePath) 
                        ? filePath 
                        : path.join(scriptDir, filePath);
                    
                    console.log(`Processing image: ${absolutePath}`);
                    
                    const base64Data = await convertImageToBase64(absolutePath);
                    if (base64Data) {
                        item.images.push(base64Data);
                        successCount++;
                    }
                }
            }
        }

        await fs.writeFile(
            scriptPath, 
            JSON.stringify(script, null, 2),
            'utf8'
        );

        console.log(`\nProcessing completed:`);
        console.log(`- Total files: ${totalFiles}`);
        console.log(`- Successfully processed: ${successCount}`);
        console.log(`- Failed: ${totalFiles - successCount}`);
        
    } catch (error) {
        console.error('Error processing script:', error.message);
        process.exit(1);
    }
}

// 取得命令列參數
const scriptPath = process.argv[2];

if (!scriptPath) {
    console.error('Please provide the script file path');
    console.error('Usage: node embedding.js <script-file-path>');
    process.exit(1);
}

// 執行處理
processScript(scriptPath);
