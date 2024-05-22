import { Modal, Table, Button, Spinner } from "flowbite-react";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { HiOutlineExclamationCircle } from "react-icons/hi";

interface Comment {
  _id: string;
  content: string;
  numberOfLikes: number;
  postId: string;
  userId: string;
  updatedAt: string;
}

export default function DashComments() {
  const { currentUser } = useSelector((state: any) => state.user);
  const [comments, setComments] = useState<Array<Comment>>([]);
  const [usernames, setUsernames] = useState<Record<string, string>>({});
  const [postNames, setPostNames] = useState<Record<string, string>>({});
  const [showMore, setShowMore] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [commentIdToDelete, setCommentIdToDelete] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    const fetchComments = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `https://avik-blog-api.vercel.app/api/comment/getcomments`,
          {
            credentials:"include",
          }
        );

        const data = await res.json();
        if (res.ok) {
          setComments(data.comments);
          if (data.comments.length < 9) {
            setShowMore(false);
          }
        }
      } catch (error: any) {
        console.log(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    if (currentUser.isAdmin) {
      fetchComments();
    }
  }, [currentUser._id]);

  useEffect(() => {
    const fetchUsernames = async () => {
      const newUsernameState: Record<string, string> = {};
      for (const comment of comments) {
        if (!usernames[comment.userId]) {
          try {
            const res = await fetch(
              `https://avik-blog-api.vercel.app/api/user/${comment.userId}`,
              {
                credentials:"include",
              }
            );
            const data = await res.json();
            if (res.ok) {
              newUsernameState[comment.userId] = data.username;
            }
          } catch (error: any) {
            console.log(error.message);
          }
        }
      }

      setUsernames((prevUsernames) => ({
        ...prevUsernames,
        ...newUsernameState,
      }));
    };

    //for Fetching Post Names: // api/post/getposts
    const fetchPostNames = async () => {
      setIsLoading(true);
      const newPostNameState: Record<string, string> = {};
      for (const comment of comments) {
        if (!usernames[comment.postId]) {
          try {
            const res = await fetch(
              `https://avik-blog-api.vercel.app/api/post/getposts/${comment.postId}`,
              {
                  credentials:"include",
              }
            );
            const data = await res.json();
            if (res.ok) {
              // console.log(data.posts[0].title);
              // newPostNameState[comment.postId] = data.posts[0].title;
              newPostNameState[comment.postId] = data.posts[0].title;
            }
          } catch (error: any) {
            console.log(error.message);
          } finally {
            setIsLoading(false);
          }
        }
      }

      setPostNames((prevPostNames) => ({
        ...prevPostNames,
        ...newPostNameState,
      }));
    };

    if (comments.length > 0) {
      fetchUsernames();
      fetchPostNames();
    }
  }, [comments]);

  const handleShowMore = async () => {
    const startIndex = comments.length;
    try {
      const res = await fetch(
        `https://avik-blog-api.vercel.app/api/comment/getcomments?startIndex=${startIndex}`,
        {
          credentials:"include",
        }
      );
      const data = await res.json();
      if (res.ok) {
        setComments((prev) => [...prev, ...data.comments]);
        if (data.comments.length < 9) {
          setShowMore(false);
        }
      }
    } catch (error: any) {
      console.log(error.message);
    }
  };

  const handleDeleteComment = async () => {
    setShowModal(false);
    try {
      const res = await fetch(
        `https://avik-blog-api.vercel.app/api/comment/deleteComment/${commentIdToDelete}`,
        {
          method: "DELETE",
          credentials:"include",
        }
      );
      const data = await res.json();
      if (res.ok) {
        setComments((prev) =>
          prev.filter((comment) => comment._id !== commentIdToDelete)
        );
        setShowModal(false);
      } else {
        console.log(data.message);
      }
    } catch (error: any) {
      console.log(error.message);
    }
  };

  // api/user/:userId

  // const getUserName = async (userId: string) => {
  //   try {
  //     const res = await fetch(`/api/user/${userId}`);
  //     const data = await res.json();
  //     if (res.ok) {
  //       return data.username;
  //     }
  //   } catch (error: any) {
  //     console.log(error.message);
  //   }
  // };

  return (
    <div className="table-auto overflow-x-scroll md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300 dark:scrollbar-track-slate-700 dark:scrollbar-thumb-slate-500">
      {isLoading && (
        <div className="flex justify-center items-center min-h-screen">
          <Spinner size="xl" />
        </div>
      )}
      {!isLoading && currentUser.isAdmin && comments.length > 0 ? (
        <>
          <Table hoverable className="shadow-md">
            <Table.Head>
              <Table.HeadCell>Date updated</Table.HeadCell>
              <Table.HeadCell>Comment content</Table.HeadCell>
              <Table.HeadCell>Number of likes</Table.HeadCell>
              <Table.HeadCell>Post Name</Table.HeadCell>
              <Table.HeadCell>User Name</Table.HeadCell>
              <Table.HeadCell>Delete</Table.HeadCell>
            </Table.Head>
            {comments.map((comment) => (
              <Table.Body className="divide-y" key={comment._id}>
                <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800">
                  <Table.Cell>
                    {new Date(comment.updatedAt).toLocaleDateString()}
                  </Table.Cell>
                  <Table.Cell>{comment.content}</Table.Cell>
                  <Table.Cell>{comment.numberOfLikes}</Table.Cell>
                  <Table.Cell>{postNames[comment.postId]}</Table.Cell>
                  <Table.Cell>{usernames[comment.userId]}</Table.Cell>
                  <Table.Cell>
                    <span
                      onClick={() => {
                        setShowModal(true);
                        setCommentIdToDelete(comment._id);
                      }}
                      className="font-medium text-red-500 hover:underline cursor-pointer"
                    >
                      Delete
                    </span>
                  </Table.Cell>
                </Table.Row>
              </Table.Body>
            ))}
          </Table>
          {showMore && (
            <button
              onClick={handleShowMore}
              className="w-full text-teal-500 self-center text-sm py-7"
            >
              Show more
            </button>
          )}
        </>
      ) : (
        <p>You have no comments yet!</p>
      )}
      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        popup
        size="md"
      >
        <Modal.Header />
        <Modal.Body>
          <div className="text-center">
            <HiOutlineExclamationCircle className="h-14 w-14 text-gray-400 dark:text-gray-200 mb-4 mx-auto" />
            <h3 className="mb-5 text-lg text-gray-500 dark:text-gray-400">
              Are you sure you want to delete this comment?
            </h3>
            <div className="flex justify-center gap-4">
              <Button color="failure" onClick={handleDeleteComment}>
                Yes, I'm sure
              </Button>
              <Button color="gray" onClick={() => setShowModal(false)}>
                No, cancel
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}
