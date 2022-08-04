let express = require('express');
let router = express.Router();
const fs = require('fs');
const path = require('path');
let count = 0;
/* GET home page. */
router.get('/', (req, res, next) => {
    let filePath = req.originalUrl;

    if (filePath.includes('favicon.ico')) {
        res.sendStatus(200);
        return;
    }

    if (filePath === '/') {
        filePath = 'index.html';
    }

    filePath = path.join(__dirname, '..', 'public', filePath);
    console.log(filePath);
    const stream = fs.createReadStream(filePath);

    stream.pipe(res);
});

module.exports = router;
