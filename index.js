const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const stripe = require("stripe")("your-secret-key");

admin.initializeApp();
const db = admin.firestore();

exports.reserve = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const { name, email, phone, date, time, guests, paymentMethodId } = req.body;

      const snapshot = await db.collection("reservations")
        .where("date", "==", date)
        .where("time", "==", time)
        .get();

      let totalGuests = 0;
      snapshot.forEach(doc => totalGuests += doc.data().guests);
      if (totalGuests + parseInt(guests) > 25) {
        return res.json({ success: false, message: "Time slot full. Please choose another." });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: 3000,
        currency: "usd",
        payment_method: paymentMethodId,
        confirmation_method: "manual",
        confirm: true,
        capture_method: "manual",
        description: "Reservation Hold for $30 - charged on late cancel only",
      });

      await db.collection("reservations").add({
        name, email, phone, date, time, guests: parseInt(guests),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        paymentIntentId: paymentIntent.id
      });

      return res.json({ success: true });
    } catch (error) {
      console.error("Error reserving:", error);
      return res.json({ success: false, message: error.message });
    }
  });
});