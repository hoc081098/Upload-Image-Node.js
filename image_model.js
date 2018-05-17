const mongoose = require('mongoose')
mongoose.Promise = global.Promise

const schema = new mongoose.Schema({
    name: String,
    image_path: String,
    created_at: {
        type: Date,
        default: Date.now
    }
})

const mongoDb = 'mongodb://localhost:27017/upload-image'
mongoose.connect(mongoDb)

module.exports = mongoose.model('imagemodel', schema)