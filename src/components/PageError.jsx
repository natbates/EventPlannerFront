
const PageError = ({ page, error }) => {
    return (
        <div className="error-fetching-page">
            <img className="sad-cat" src="/svgs/sad-cat.svg" alt="Error" />
            <h1>{page != "Log In" ? "Failed To Fetch" : "Failed To"} {page}</h1>
            <h3>{error}</h3>
        </div>
    );
}

export default PageError;