import { useTheme } from "../contexts/theme";

const NotFound = () => {

    const { theme } = useTheme();

    return (
        <div className="page-not-found page">
            {theme === "light" ?
                <img className = "sad-cat" src="/svgs/cats/sad-cat.svg" alt="Not Found" /> :
                <img className = "sad-cat" src="/svgs/cats/sad-cat-white.svg" alt="Not Found" />}
            <h1>404</h1>
            <h3>Yikes, this page doesnt exist</h3>
        </div>
    );
};

export default NotFound;