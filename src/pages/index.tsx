import {SignedIn, SignIn, SignInButton, SignOutButton, useAuth, UserProfile, useUser } from "@clerk/nextjs";
import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import {Fragment, useState } from "react";
import {
  FaceFrownIcon,
  FaceSmileIcon,
  FireIcon,
  HandThumbUpIcon,
  HeartIcon,
  PaperClipIcon,
  XMarkIcon,
} from '@heroicons/react/20/solid'
import { Listbox, Transition } from '@headlessui/react'
import EmojiPicker, { Theme } from 'emoji-picker-react';

import { api } from "~/utils/api";
import LoadingSpinner from "~/components/LoadingSpinner";
import toast from "react-hot-toast";

const CreatePost = () => {
  const [content, setContent] = useState('');
  const ctx = api.useContext();
  const { mutate, isLoading: isPosting } = api.posts.create.useMutation({
    onSuccess: (data) => {
      setContent('');
      void ctx.posts.getAll.invalidate();
    },
    onError: (error) => {
      const errorMessage = error.data?.zodError?.fieldErrors?.content?.[0];
      if(errorMessage) {
        toast.error(errorMessage);
      } else {
        toast.error('Something went wrong, please try again later.');
      }
    }
  });
  const addEmoji = (emojiObject: { emoji: string; }) => {
    setContent(content + emojiObject.emoji);
  }

  const createPostMutation = () => {
    const  data = mutate({ content });
  }
  const {user, isSignedIn, isLoaded} = useUser();
  if(!isLoaded) return <LoadingSpinner />;

  if(!isSignedIn) return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center space-y-4">
        <div className="text-2xl text-white">You need to sign in to create a post.</div>
        <SignInButton>
          <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
            Sign in
          </button>
        </SignInButton>
      </div>
    </div>
  );

  return  (<div className="flex items-start space-x-4">
    <SignOutButton />
    <div className="flex-shrink-0">
      <img
          className="inline-block h-10 w-10 rounded-full"
          src={user.profileImageUrl}
          alt=""
      />
    </div>
    <div className="min-w-0 flex-1">
      <form action="#" className="relative">
        <div className="overflow-hidden rounded-lg shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-indigo-600">
          <label htmlFor="comment" className="sr-only">
            Add your comment
          </label>
          <textarea
              defaultValue={content}
              rows={3}
              name="comment"
              disabled={isPosting}
              onKeyUp={(e) => {
                if(e.key === 'Enter') {
                  e.preventDefault();
                  createPostMutation();
                }
              }}
              id="comment"
              className="block w-full resize-none border-0 bg-transparent text-white placeholder:text-white focus:ring-0 sm:py-1.5 sm:text-sm sm:leading-6"
              placeholder="Share how you feel..."
          />

          {/* Spacer element to match the height of the toolbar */}
          <div className="py-2" aria-hidden="true">
            {/* Matches height of button in toolbar (1px border + 36px content height) */}
            <div className="py-px">
              <div className="h-2" />
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex justify-between py-2 pl-3 pr-2">
          <div className="flex items-center space-x-5">
            <div className="flex items-center">
              <Listbox>
                {({ open }) => (
                    <>
                      <Listbox.Label className="sr-only"> Your mood </Listbox.Label>
                      <div className="relative">
                        <Listbox.Button className="relative -m-2.5 flex h-10 w-10 items-center justify-center rounded-full text-gray-400 hover:text-gray-500">
                          <span className="flex items-center justify-center">
                                <span>
                                <FaceSmileIcon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                                <span className="sr-only"> Add your mood </span>
                              </span>
                          </span>
                        </Listbox.Button>

                        <Transition
                            show={open}
                            as={Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                          <Listbox.Options className="absolute z-10 -ml-6 py-3 text-base shadow ring-1 ring-black ring-opacity-5 focus:outline-none sm:ml-auto sm:w-64 sm:text-sm">
                            <EmojiPicker emojiVersion={"4.0"} onEmojiClick={addEmoji} theme={Theme.DARK}></EmojiPicker>
                          </Listbox.Options>
                        </Transition>
                      </div>
                    </>
                )}
              </Listbox>
            </div>
          </div>
          <div className="flex-shrink-0">
            <button
                type="button"
                disabled={isPosting}
                onClick={createPostMutation}
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              { !isPosting ? "Post" : <LoadingSpinner inButton={true} /> }
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>);
}

const Feed = () => {
  const { data, isLoading } = api.posts.getAll.useQuery();
  if(isLoading) return <LoadingSpinner />;
  if (!data) return <p>Something went wrong</p>;
  return (
    <div className={"flex flex-col"}>
      {data.map((post) => (
        <div key={post.id} className={"pl-4 pt-4 relative flex items-start space-x-3"}>
          <div className="relative">
           <Link href={`/@${(!(post && post.author) ? "newUrl" : post.author.username) || ""}`}>
             <img
               className="flex h-10 w-10 items-center justify-center rounded-full"
               src={post.author ? post.author.profileImageUrl : ""}
               alt=""
             />
           </Link>
          </div>
          <div className="min-w-0 flex-1">
            <div>
              <div className="text-sm">
                <Link href={`/@${(!(post && post.author) ? "newUrl" : post.author.username) || ""}`}>
                <p className="font-medium text-white">
                  {post.author ? post.author.username : "Anonymous"}
                </p>
                </Link>
              </div>
              <Link href={`/post/${post.id}`}>
                <p className="mt-0.5 text-sm text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</p>
              </Link>
            </div>
            <div className="mt-2 text-sm text-gray-700">
              <p className={"text-2xl"}>{post.content}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

}
const Home: NextPage = () => {
  api.posts.getAll.useQuery();
  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex h-screen justify-center justify-center">
        <div className="w-full md:max-w-2xl border-slate-100 border-x h-full">
          <div className="border-b border-slate-100 p-4">
                <div>
                  <CreatePost />
                </div>
          </div>
          <Feed />
        </div>
      </main>
    </>
  );
};

export default Home;
