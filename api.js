const express = require('express');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const { category } = req.body;
    if (!category) {
      return cb(new Error('Category is required'), null);
    }

    const uploadPath = path.join('uploads', category);
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

app.use(express.json());

// Upload file
app.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.body.category) {
      return res.status(400).send({ status: false, msg: `category is required` });
    }
    if (!req.file) {
      return res.status(400).send({ status: false, msg: `File is required` });
    }
    return res.send({ status: true, msg: 'File uploaded successfully' });
  } catch (err) {
    return res.send({ status: false, msg: `Err: ${err}` });
  }
});

// List category files
app.get('/files', async (req, res) => {
  const arr = {};
  const uploadPath = path.join('uploads', "/");
  try {
    const directories = await fs.promises.readdir(uploadPath);

    for (const directory of directories) {
      const categoryPath = path.join('uploads', directory);
      const files = await fs.promises.readdir(categoryPath);
      arr[directory] = files;
    }
    return res.send({ status: true, msg: 'Record found', data: arr });
  } catch (err) {
    return res.send({ status: false, msg: err, data: [] });
  }
});

// List files by category
app.get('/files/:category', (req, res) => {
  const category = req.params.category;
  const categoryPath = path.join('uploads', category);
  try {
    fs.readdir(categoryPath, (err, files) => {
      if (err) {
        return res.status(500).send({ status: false, msg: 'No category found', data: [] });
      }
      return res.send({ status: true, msg: 'category found', data: files });
    });
  } catch (err) {
    return res.status(500).send({ status: false, msg: err, data: [] });
  }
});

// Delete file by filename
app.delete('/files/:category/:filename', (req, res) => {
  const category = req.params.category;
  const filename = req.params.filename;
  const filePath = path.join('uploads', category, filename);

  try {
    fs.unlink(filePath, (err) => {
      if (err) {
        return res.status(500).send({ status: false, msg: `${err}` });
      }
      return res.send({ status: true, msg: 'File deleted successfully.' });
    });
  } catch (err) {
    return res.send({ status: false, msg: err });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});