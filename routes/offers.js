const express = require("express");
const router = express.Router();

const Offer = require("../models/Offer");

const cloudinary = require("cloudinary").v2;

//import du middlware isAuthenticated

const isAuthenticated = require("../middleware/isAuthenticated");

router.post("/offer/publish", isAuthenticated, async (req, res) => {
  try {
    const newOffer = new Offer({
      product_name: req.fields.title,
      product_description: req.fields.description,
      product_price: req.fields.price,
      product_details: [
        { MARQUE: req.fields.brand },
        { TAILLE: req.fields.size },
        { ETAT: req.fields.condition },
        { COULEUR: req.fields.color },
        { EMPLACEMENT: req.fields.city },
      ],
      owner: req.user,
    });

    //J'envoie mon image sur cloudinary
    const result = await cloudinary.uploader.upload(req.files.picture.path);

    //J'enregistre ce que me renvoie cloudinary dans la clé product_image
    newOffer.product_image = result;

    await newOffer.save();

    res.json(newOffer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// route pour filtrer les offres

router.get("/offers", async (req, res) => {
  try {
    let filters = {};
    if (req.query.title) {
      filters.product_name = new RegExp(req.query.title, "i");
    }
    if (req.query.priceMin) {
      filters.product_price = {
        $gte: req.query.priceMin,
      };
    }
    if (req.query.priceMax) {
      if (filters.product_price) {
        filters.product_price.$lte = req.query.priceMax;
      } else {
        filters.product_price = {
          $lte: req.query.priceMax,
        };
      }
    }

    let sort = {};

    if (req.query.sort === "price-asc") {
      sort = { product_price: "asc" };
    } else if (req.query.sort === "price-desc") {
      sort = { product_price: "desc" };
    }

    let page;
    if (!req.query.page) {
      page = 1;
    } else if (Number(req.query.page) < 1) {
      page = 1;
    } else {
      page = Number(req.query.page);
    }
    let limit = Number(req.query.limit) || 10;

    const count = await Offer.countDocuments(filters);

    const offers = await Offer.find(filters)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({
        path: "owner",
        select: "_id account",
      });
    res.status(200).json({
      count: count,
      offers: offers,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/// route pour retrouver une offre avec son id
router.get("/offer/:id", async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate({
      path: "owner",
      select: "account.username account.phone account.avatar",
    });
    res.json(offer);
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
