const { hashPassword } = require("../helpers/bcrypt");
const { User, UserProfile } = require("../models");
const { sequelize } = require("../models");


class UserController {
  static async register(req, res, next) {
    const { name, dateOfBirth, email, password } = req.body;

    try {
      const result = await sequelize.transaction(async (t) => {

        const hashedPassword = hashPassword(password);

        // console.log(hashedPassword);
        
      
        const user = await User.create(
          {
            email,
            password: hashedPassword,
          },
          { transaction: t }
        );

        
        const userProfile = await UserProfile.create(
          {
            name,
            dateOfBirth,
            UserId: user.id,
          },
          { transaction: t }
        );

        return { user, userProfile }; 
      });

      res.status(201).json({
        message: "User registered successfully",
        data: result,
      });
    } catch (error) {
      console.error("Error during transaction:", error);
      res.status(500).json({ message: "Registration failed", error });
    }
  }
}

module.exports = UserController;
