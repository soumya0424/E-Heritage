const Monument = require('../models/Monument');

exports.getAllMonuments = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;

        const monuments = await Monument.getAll(limit, offset);
        res.json({ success: true, data: monuments });
    } catch (err) {
        next(err);
    }
};

exports.getMonumentById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const monument = await Monument.getById(id);
        if (!monument) return res.status(404).json({ message: 'Monument not found' });
        res.json({ success: true, data: monument });
    } catch (err) {
        next(err);
    }
};
