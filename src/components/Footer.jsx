import "../styles/footer.css";
import { Link } from "react-router-dom";
import { useTheme } from "../contexts/theme";

const Footer = () => {

  const { theme } = useTheme(); 

  // Define the icon sources based on the theme
  const githubIcon = theme === "dark" ? "/svgs/socials/github-white.svg" : "/svgs/socials/github.svg";
  const discordIcon = theme === "dark" ? "/svgs/socials/discord-white.svg" : "/svgs/socials/discord.svg";
  const twitterIcon = theme === "dark" ? "/svgs/socials/twitter-white.svg" : "/svgs/socials/twitter.svg";

  return (
    <div className="footer-container">
      <footer className="footer">
        <div className="social-icons">
          <a
            href="https://github.com/natbates"  // Replace with your GitHub URL
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src={githubIcon}
              alt="Github"
              className="social-icon"
            />
          </a>
          <a
            href="https://discord.gg/VmSqHaXtaQ"  // Replace with your Discord invite link
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src={discordIcon}
              alt="Discord"
              className="social-icon"
            />
          </a>
          <a
            href="https://x.com/NathanBates04"  // Replace with your Twitter URL
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src={twitterIcon}
              alt="Twitter"
              className="social-icon"
            />
          </a>
        </div>
        <div className="footer-links">
          <Link to="/tos">TOS</Link>
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/support">Support</Link>
          <Link to="/contact">Contact</Link>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
