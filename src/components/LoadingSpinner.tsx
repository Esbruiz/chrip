const LoadingSpinner = (props: { inButton?: boolean }) => {
    const { inButton } = props;
    return (
        inButton ? (
        <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        </div> ) : (
        <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
        </div>
        )
    );
};
export default LoadingSpinner;