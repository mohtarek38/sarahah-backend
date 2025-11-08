import User from "../DB/Models/users.model.js";
import BlackListedTokens from "../DB/Models/blacklisted-tokens.model.js";
import { verifyToken } from "../Utils/tokens.utils.js";

export const authenticationMiddleware = async (req, res, next) => {
  try {
    // Get token from headers
    const accesstoken = req.headers.authorization?.split(" ")[1];
    if (!accesstoken) {
      return res.status(401).json({ message: "Missing Access Token" });
    }
    // Verify token
    const decodedData = verifyToken(accesstoken, process.env.JWT_ACCESS_SECRET);
    // Check if jti exists
    if (!decodedData || !decodedData.jti) {
      return res.status(401).json({ message: "Invalid Token" });
    }
    // Check if token is blacklisted
    const isBlacklistedToken = await BlackListedTokens.findOne({ tokenId: decodedData.jti });
    if (isBlacklistedToken) {
      return res.status(401).json({ message: "Invalid Token" });
    }
    // Get user info from decoded token
    const user = await User.findById(decodedData?._id, "-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Attach logged in user info to request
    req.loggedInUser = {
      user,
      token: { jti: decodedData.jti, expirationDate: decodedData.exp },
    };
    // Proceed to next middleware or route handler
    next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({ message: "Invalid Token", error: error.message });
  }
};
