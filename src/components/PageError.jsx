import { useTheme } from "../contexts/theme";

const PageError = ({ page, error }) => {

    const { theme } = useTheme();

    return (
        <div className="error-fetching-page">
            {theme === "light" ?
            <img className = "sad-cat" src="/svgs/cats/sad-cat.svg" alt="Error" /> :
            <img className = "sad-cat" src="/svgs/cats/sad-cat-white.svg" alt="Error" />}
            <h1>{page != "Log In" ? "Failed To Fetch" : "Failed To"} {page}</h1>
            <h3>{error}</h3>
        </div>
    );
}

export default PageError;