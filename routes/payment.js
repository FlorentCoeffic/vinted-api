const express = require("express");
const router = express.Router();
const stripe = require("stripe")(
  "sk_test_51JwRmlDvCv1XQM1NmqnnnWq7WflgXsqxW8RunsDxMnY8SUNusuCiW37D3VdfxWz57P8vWgRdRT19lBlYxuDkXlR2003LvW95mJ"
);
const formidableMiddleware = require("express-formidable");
router.use(formidableMiddleware());

/* Votre clé privée doit être indiquée ici */
// const stripe = createStripe(process.env.STRIPE_API_SECRET);

// on réceptionne le token
router.post("/payment", async (req, res) => {
  try {
    // on envoie le token a Stripe avec le montant
    let { status } = await stripe.charges.create({
      amount: req.fields.amount * 100,
      currency: "eur",
      description: `Paiement vinted pour : ${req.fields.title}`,
      source: req.fields.token,
    });
    // Le paiement a fonctionné
    // On peut mettre à jour la base de données
    // On renvoie une réponse au client pour afficher un message de statut
    res.json({ status });
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ error: "ici" });
  }
});

module.exports = router;
