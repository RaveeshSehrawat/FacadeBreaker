import ChatContainer from "@/components/ChatContainer";

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24 bg-gray-50 dark:bg-gray-900">
            <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-8 md:mb-0">
                    TruthLens AI
                </h1>
                <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
                    <p className="flex place-items-center gap-2 p-8 lg:p-0 text-gray-800 dark:text-gray-200">
                        Powered by Google Gemini
                    </p>
                </div>
            </div>

            <div className="w-full max-w-3xl flex-1 flex flex-col my-8">
                <ChatContainer />
            </div>

        </main>
    );
}
