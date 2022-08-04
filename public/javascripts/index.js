const SparkMD5 = window.SparkMD5;
//  const spark = new SparkMD5.ArrayBuffer();
// spark.append(e.target.result);

function xhrSend(fd, cb) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/gists/file');
    xhr.onreadystatechange = function () {
        console.log('state change', xhr.readyState);
        if (xhr.readyState == 4) {
            console.log(xhr.responseText);
            cb && cb();
        }
    };
    xhr.send(fd);
}

class FileUpload {
    constructor(file) {
        this.file = file;
    }

    async uploadFile() {
        const { hash, chunks } = await this.fileHash();
        console.log('hash: ', hash);
        this.sendFile(hash, chunks);
    }
    async sendFile(hash, chunks) {
        let sendCount = 0;
        chunks.forEach(function (chunk, idx) {
            const fd = new FormData();
            fd.append('hash', hash);
            fd.append('index', idx);
            fd.append('data', chunk);
            xhrSend(fd, () => {
                sendCount++;

                if (sendCount === chunks.length) {
                    const mergeFd = new FormData();
                    mergeFd.append('hash', hash);
                    mergeFd.append('total', sendCount);
                    mergeFd.append('type', 'merge');
                    xhrSend(mergeFd);
                }
            });
        });
    }

    async fileHash() {
        let chunkSize = 1024 * 1024 * 50;
        let offset = 0;
        let chunks = [];
        while (offset * chunkSize < this.file.size) {
            chunks.push(this.file.slice(offset * chunkSize, (offset + 1) * chunkSize));
            offset++;
        }

        return new Promise((resolve, reject) => {
            const spark = new SparkMD5.ArrayBuffer();
            async function appendToSpark(file) {
                return new Promise((r) => {
                    const fileReader = new FileReader();
                    fileReader.readAsArrayBuffer(file);
                    fileReader.onload = (e) => {
                        spark.append(e.target.result);
                        r();
                    };
                });
            }

            let chunkIdx = 0;
            async function loop(deadline) {
                while (deadline.timeRemaining() > 1 && chunks.length > chunkIdx) {
                    await appendToSpark(chunks[chunkIdx]);
                    chunkIdx++;
                }

                if (chunks.length == chunkIdx) {
                    return resolve({
                        hash: spark.end(),
                        chunks
                    });
                }
                window.requestIdleCallback(loop);
            }
            window.requestIdleCallback(loop);
        });
    }
}

window.onload = function () {
    upload.addEventListener('change', (e) => {
        const loader = new FileUpload(e.target.files[0]);
        loader.uploadFile();
    });
};
