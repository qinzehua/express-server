var fs = require('fs');
var express = require('express');
var multer = require('multer');
var path = require('path');
var router = express.Router();

const storage = multer.diskStorage({
    destination(req, res, cb) {
        cb(null, 'upload_tmp');
    },
    filename(req, file, cb) {
        cb(null, req.body.hash + '_' + req.body.index);
    }
});
const upload = multer({ storage });

router.post('/file', upload.any(), function (req, res, next) {
    const { type, hash, total } = req.body;
    if (type === 'merge') {
        var writeStream = fs.createWriteStream(path.join(process.cwd(), 'upload_tmp/hash'));
        let count = 0;
        function mergeFn() {
            var fname = path.join(process.cwd(), `upload_tmp/${hash}_${count}`);
            var readStream = fs.createReadStream(fname);
            readStream.pipe(writeStream, { end: false });
            readStream.on('end', function () {
                fs.unlink(fname, function (err) {
                    if (err) {
                        throw err;
                    }
                });
                count += 1;
                if (count < total) {
                    mergeFn();
                }
            });
        }
        mergeFn();
    } else {
        res.send({ message: 'ok' });
    }
});

module.exports = router;
