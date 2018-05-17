const express = require('express')
const app = express()
const router = express.Router()
const path = require('path')
const fileType = require('file-type')
const multer = require('multer')
const fs = require('fs')
const imagemodel = require('./image_model')

app.use(require('morgan')('combined'))

//mongodb://localhost:27017/upload-image

const upload = multer({
    dest: 'images/',
    fileFilter: (req, file, callback) => {
        if (!/\S+\.(jpg|bmp|gif|png)/gi.test(file.originalname)) {
            return callback(Error('Invalid image file name'), false)
        }


        const reqName = req.params.image_name
        imagemodel.find({ name: reqName }).limit(1).exec((err, res) => {
            if (err) {
                console.log(err)
                return callback(err, false)
            }

            if (res.length === 0) callback(null, true)
            else callback(Error(`Image with name: "${reqName}" exists`), false)
        })
    }
}).single('image')

router.post('/images/upload/:image_name', (req, res) => {
    console.log(`Post: req = ${req}`)
    upload(req, res, (err) => {
        if (err) {
            res.status(400).json({ message: err.message })
            return
        }

        const reqName = req.params.image_name
        const imagePath = path.join('images', req.file.filename)

        const model = new imagemodel({
            name: reqName,
            image_path: imagePath,
            created_at: new Date()
        })

        model.save((err) => {
            if (err)  {
                console.log(err)
                return res.status(500).json({message: err.message})
            }

            res.status(200).json({ message: `Uploaded image "${reqName}" successfully` })
        })
    })
})

router.get('/images/:image_name', (req, res) => {
    console.log(`Get: req = ${req}`)
    imagemodel.find({name: req.params.image_name}, {image_path: 1, _id: 0}).limit(1).exec((err, docs) => {
        if (err) {
            console.log(err)
            return res.status(500).json({message: err.message})
        }

        if (docs.length === 0) {
            return res.status(404).json({ message: 'No such image file' })
        }

        const imagePath = path.join(__dirname, docs[0].image_path)
        try {
            const buffer = fs.readFileSync(imagePath)
            const mime = fileType(buffer).mime
            res.writeHead(200, { 'Content-Type': mime })
            res.end(buffer, 'binary')
        } catch (error) {
            console.log(error.code)
            if (error.code === 'ENOENT') {
                res.status(404).json({ message: 'No such image file' })
            } else {
                res.status(500).json({ message: error.message })
            }
        }
    })
})

router.get('/images', (req, res) => {
    console.log(`Get: req = ${req}`)
    const start = parseInt(req.query.start) || 0
    const limit = parseInt(req.query.limit) || 20

    imagemodel.find({}, { name: 1, _id: 0 }).sort({ created_at: -1 }).skip(start).limit(limit).exec((err, docs) => {
        if (err) {
            console.log(err)
            return res.status(500).json({message: err.message, data: null})
        }

        res.status(200).json({
            message: 'Get data successfully',
            data: docs.map(e => e.name)
        })
    })
})

router.post("/test", (req, res) => {
    res.status(200).send("Nice")
})

app.use('/', router)
app.listen(3001, () => {
    console.log('Server is running at port 3001')
})
