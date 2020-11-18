var users = [];

function addUser(userId, username, room, avatarUrl) {
    user = { userId, username, room, avatarUrl };
    users.push(user);
}

function getUserById(userId) {
    return users.find(x => x.userId === userId);
}

function getUsers(room) {
    const list = users.filter(x => x.room === room);
    return list;
}

function deletePeopleById(userId) {
    users = users.filter(x => x.userId != userId);
}

function isExisted(username) {
    return existed = !(users.every(x => x.username !== username));
}

module.exports = {
    addUser,
    getUserById,
    getUsers,
    deletePeopleById,
    isExisted
}

