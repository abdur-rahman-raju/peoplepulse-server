import { createRemoteJWKSet, jwtVerify } from "jose";


const clientUrl = () =>
  (process.env.CLIENT_URL || "").split(",")[0].trim().replace(/\/$/, "");


let jwks;
function getJWKS() {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${clientUrl()}/api/auth/jwks`));
  }
  return jwks;
}

export async function verifyToken(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Please log in to continue" });
  }

  try {
    const { payload } = await jwtVerify(token, getJWKS(), {
      issuer: clientUrl(),
    });

    if (!payload.email) {
      throw new Error("Token has no email");
    }


    req.user = {
      id: payload.id || payload.sub,
      email: payload.email,
      name: payload.name || "Volunteer",
      image: payload.image || "",
    };
    next();
  } catch (err) {
    console.error("JWT verification failed:", err.message);
    res.status(401).json({ message: "Your session is invalid or expired. Please log in again." });
  }
}