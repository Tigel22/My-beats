const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// File storage setup for beats and images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = file.fieldname === 'beat' ? 'uploads/beats/' : 'uploads/images/';
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});
const upload = multer({ storage });

// Mock database (in-memory for simplicity)
const beats = [];

// Ensure upload directories exist
fs.mkdirSync('uploads/beats', { recursive: true });
fs.mkdirSync('uploads/images', { recursive: true });

// Routes

// Get all beats
app.get('/api/beats', (req, res) => {
    res.json(beats);
});

// Upload a new beat (with optional image)
app.post('/api/upload', upload.fields([{ name: 'beat' }, { name: 'image' }]), (req, res) => {
    const { title, description } = req.body;

    if (!req.files || !req.files.beat) {
        return res.status(400).json({ error: 'Beat file is required' });
    }

    const beat = {
        id: beats.length + 1,
        title,
        description,
        beatFileUrl: `/uploads/beats/${req.files.beat[0].filename}`,
        imageUrl: req.files.image ? `/uploads/images/${req.files.image[0].filename}` : null,
    };

    beats.push(beat);
    res.json(beat);
});

// Delete a beat
app.delete('/api/beats/:id', (req, res) => {
    const beatId = parseInt(req.params.id, 10);
    const index = beats.findIndex(beat => beat.id === beatId);

    if (index === -1) {
        return res.status(404).json({ error: 'Beat not found' });
    }

    // Delete files from the server
    const beat = beats[index];
    if (beat.beatFileUrl) {
        const beatPath = path.join(__dirname, beat.beatFileUrl);
        if (fs.existsSync(beatPath)) fs.unlinkSync(beatPath);
    }
    if (beat.imageUrl) {
        const imagePath = path.join(__dirname, beat.imageUrl);
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    // Remove from the database
    beats.splice(index, 1);
    res.json({ message: 'Beat deleted successfully' });
});

// Serve uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
