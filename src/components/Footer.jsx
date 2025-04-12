import "../styles/footer.css";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <div className="footer-container">
      <footer className="footer">
        <div className="social-icons">
          <a
            href="https://github.com/your_github_profile"  // Replace with your GitHub URL
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="/svgs/socials/github.svg"
              alt="Github"
              className="social-icon"
            />
          </a>
          <a
            href="https://discord.gg/your_discord_invite"  // Replace with your Discord invite link
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="/svgs/socials/discord.svg"
              alt="Discord"
              className="social-icon"
            />
          </a>
          <a
            href="https://twitter.com/your_twitter_handle"  // Replace with your Twitter URL
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="/svgs/socials/twitter.svg"
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
